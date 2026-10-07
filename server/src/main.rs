use axum::{
    Router,
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode, header},
    response::{IntoResponse, Response},
    routing::{get, post},
    body::Body,
    Json,
};
use git2::{Repository, ObjectType, DiffOptions, Sort, Oid};
use serde::{Deserialize, Serialize};
use std::{path::PathBuf, process::Stdio, sync::Arc};
use tokio::process::Command;
use tower_http::cors::CorsLayer;

#[derive(Clone)]
struct AppState {
    data_dir: PathBuf,
}

impl AppState {
    fn repo_path(&self, user: &str, repo: &str) -> PathBuf {
        self.data_dir.join("repos").join(user).join(format!("{}.git", repo))
    }

    fn open_repo(&self, user: &str, repo: &str) -> Result<Repository, StatusCode> {
        let path = self.repo_path(user, repo);
        Repository::open_bare(&path).map_err(|_| StatusCode::NOT_FOUND)
    }

    fn db_path(&self) -> PathBuf {
        self.data_dir.join("forge.json")
    }
}

#[derive(Serialize, Deserialize, Clone)]
struct RepoRecord {
    id: serde_json::Value,
    user: String,
    name: String,
    description: String,
    visibility: String,
    created_at: String,
    updated_at: String,
}

#[derive(Serialize, Deserialize, Default)]
struct Db {
    repos: Vec<RepoRecord>,
    #[serde(rename = "nextId", default)]
    next_id: Option<serde_json::Value>,
}

fn read_db(state: &AppState) -> Db {
    std::fs::read_to_string(state.db_path())
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn write_db(state: &AppState, db: &Db) {
    let _ = std::fs::write(state.db_path(), serde_json::to_string_pretty(db).unwrap());
}

#[derive(Serialize)]
struct FileEntry {
    name: String,
    #[serde(rename = "type")]
    kind: String,
    size: Option<u64>,
}

#[derive(Serialize)]
struct CommitInfo {
    sha: String,
    #[serde(rename = "shortSha")]
    short_sha: String,
    message: String,
    author: String,
    email: String,
    date: String,
    #[serde(rename = "relativeDate")]
    relative_date: String,
}

#[derive(Serialize)]
struct DiffFileInfo {
    #[serde(rename = "oldPath")]
    old_path: String,
    #[serde(rename = "newPath")]
    new_path: String,
    status: String,
    additions: usize,
    deletions: usize,
    hunks: Vec<DiffHunkInfo>,
}

#[derive(Serialize)]
struct DiffHunkInfo {
    header: String,
    lines: Vec<DiffLineInfo>,
}

#[derive(Serialize)]
struct DiffLineInfo {
    #[serde(rename = "type")]
    kind: String,
    content: String,
    #[serde(rename = "oldNum")]
    old_num: Option<u32>,
    #[serde(rename = "newNum")]
    new_num: Option<u32>,
}

#[derive(Serialize)]
struct BranchInfo {
    name: String,
    is_head: bool,
}

#[derive(Serialize)]
struct DiffStats {
    files: usize,
    additions: usize,
    deletions: usize,
}

#[derive(Serialize)]
struct ContributionDay {
    date: String,
    count: usize,
}

fn relative_time(secs_ago: i64) -> String {
    if secs_ago < 60 { return "just now".into(); }
    if secs_ago < 3600 { return format!("{} minutes ago", secs_ago / 60); }
    if secs_ago < 86400 { return format!("{} hours ago", secs_ago / 3600); }
    if secs_ago < 2592000 { return format!("{} days ago", secs_ago / 86400); }
    if secs_ago < 31536000 { return format!("{} months ago", secs_ago / 2592000); }
    format!("{} years ago", secs_ago / 31536000)
}

#[derive(Deserialize)]
struct InfoRefsQuery {
    service: Option<String>,
}

fn pkt_line(s: &str) -> Vec<u8> {
    let len = s.len() + 4;
    format!("{:04x}{}", len, s).into_bytes()
}

async fn info_refs(
    State(state): State<Arc<AppState>>,
    Path((user, raw_repo)): Path<(String, String)>,
    Query(query): Query<InfoRefsQuery>,
) -> Response {
    let repo = raw_repo.trim_end_matches(".git");
    let service = match &query.service {
        Some(s) if s == "git-upload-pack" || s == "git-receive-pack" => s.clone(),
        _ => return StatusCode::BAD_REQUEST.into_response(),
    };

    let rp = state.repo_path(&user, repo);
    if !rp.exists() {
        return StatusCode::NOT_FOUND.into_response();
    }

    let svc_name = service.replace("git-", "");
    let output = Command::new("git")
        .args([&svc_name, "--stateless-rpc", "--advertise-refs"])
        .arg(&rp)
        .output()
        .await;

    match output {
        Ok(out) if out.status.success() => {
            let mut body = pkt_line(&format!("# service={}\n", service));
            body.extend_from_slice(b"0000");
            body.extend_from_slice(&out.stdout);

            let mut headers = HeaderMap::new();
            headers.insert(
                header::CONTENT_TYPE,
                format!("application/x-{}-advertisement", service).parse().unwrap(),
            );
            headers.insert(header::CACHE_CONTROL, "no-cache".parse().unwrap());
            (headers, body).into_response()
        }
        _ => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}

async fn git_service(
    State(state): State<Arc<AppState>>,
    Path((user, raw_repo, service)): Path<(String, String, String)>,
    body: Body,
) -> Response {
    let repo = raw_repo.trim_end_matches(".git");
    let svc_name = service.replace("git-", "");
    let rp = state.repo_path(&user, repo);

    if !rp.exists() {
        return StatusCode::NOT_FOUND.into_response();
    }

    let mut child = match Command::new("git")
        .args([&svc_name, "--stateless-rpc"])
        .arg(&rp)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(c) => c,
        Err(_) => return StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    };

    let mut stdin = child.stdin.take().unwrap();
    let body_bytes = match axum::body::to_bytes(body, 50 * 1024 * 1024).await {
        Ok(b) => b,
        Err(_) => return StatusCode::BAD_REQUEST.into_response(),
    };
    tokio::spawn(async move {
        use tokio::io::AsyncWriteExt;
        let _ = stdin.write_all(&body_bytes).await;
        let _ = stdin.shutdown().await;
    });

    let output = match child.wait_with_output().await {
        Ok(o) => o,
        Err(_) => return StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    };

    let mut headers = HeaderMap::new();
    headers.insert(
        header::CONTENT_TYPE,
        format!("application/x-{}-result", service).parse().unwrap(),
    );
    headers.insert(header::CACHE_CONTROL, "no-cache".parse().unwrap());
    (headers, output.stdout).into_response()
}

async fn list_repos_handler(State(state): State<Arc<AppState>>) -> Json<Vec<RepoRecord>> {
    let db = read_db(&state);
    Json(db.repos)
}

#[derive(Deserialize)]
struct CreateRepoBody {
    user: String,
    name: String,
    description: Option<String>,
    visibility: Option<String>,
}

async fn create_repo_handler(
    State(state): State<Arc<AppState>>,
    Json(body): Json<CreateRepoBody>,
) -> Response {
    if body.user.is_empty() || body.name.is_empty() {
        return (StatusCode::BAD_REQUEST, "user and name required").into_response();
    }

    let mut db = read_db(&state);
    if db.repos.iter().any(|r| r.user == body.user && r.name == body.name) {
        return (StatusCode::CONFLICT, "Repository already exists").into_response();
    }

    let rp = state.repo_path(&body.user, &body.name);
    if let Err(e) = Repository::init_bare(&rp) {
        return (StatusCode::INTERNAL_SERVER_ERROR, format!("git init failed: {}", e)).into_response();
    }

    let now = chrono::Utc::now().to_rfc3339();
    let record = RepoRecord {
        id: serde_json::Value::String(format!("{}_{}", body.user, body.name)),
        user: body.user,
        name: body.name,
        description: body.description.unwrap_or_default(),
        visibility: body.visibility.unwrap_or_else(|| "public".into()),
        created_at: now.clone(),
        updated_at: now,
    };
    db.repos.push(record.clone());
    write_db(&state, &db);

    Json(record).into_response()
}

async fn list_files(
    State(state): State<Arc<AppState>>,
    Path((user, repo)): Path<(String, String)>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Response {
    let r = match state.open_repo(&user, &repo) {
        Ok(r) => r,
        Err(s) => return s.into_response(),
    };

    let head = match r.head() {
        Ok(h) => h,
        Err(_) => return Json(Vec::<FileEntry>::new()).into_response(),
    };

    let commit = head.peel_to_commit().unwrap();
    let tree = commit.tree().unwrap();

    let prefix = params.get("path").map(|s| s.as_str()).unwrap_or("");
    let target_tree = if prefix.is_empty() {
        tree
    } else {
        match tree.get_path(std::path::Path::new(prefix)) {
            Ok(entry) => {
                let obj = entry.to_object(&r).unwrap();
                match obj.into_tree() {
                    Ok(t) => t,
                    Err(_) => return StatusCode::BAD_REQUEST.into_response(),
                }
            }
            Err(_) => return StatusCode::NOT_FOUND.into_response(),
        }
    };

    let mut entries: Vec<FileEntry> = target_tree
        .iter()
        .map(|entry| {
            let kind = match entry.kind() {
                Some(ObjectType::Tree) => "tree",
                _ => "blob",
            };
            let size = if kind == "blob" {
                entry.to_object(&r).ok().and_then(|o| o.as_blob().map(|b| b.size() as u64))
            } else {
                None
            };
            FileEntry {
                name: entry.name().unwrap_or("").to_string(),
                kind: kind.to_string(),
                size,
            }
        })
        .collect();

    entries.sort_by(|a, b| {
        let a_is_tree = a.kind == "tree";
        let b_is_tree = b.kind == "tree";
        b_is_tree.cmp(&a_is_tree).then(a.name.cmp(&b.name))
    });

    Json(entries).into_response()
}

async fn read_file(
    State(state): State<Arc<AppState>>,
    Path((user, repo, path)): Path<(String, String, String)>,
) -> Response {
    let r = match state.open_repo(&user, &repo) {
        Ok(r) => r,
        Err(s) => return s.into_response(),
    };

    let head = match r.head() {
        Ok(h) => h,
        Err(_) => return StatusCode::NOT_FOUND.into_response(),
    };

    let commit = head.peel_to_commit().unwrap();
    let tree = commit.tree().unwrap();

    match tree.get_path(std::path::Path::new(&path)) {
        Ok(entry) => {
            let obj = entry.to_object(&r).unwrap();
            if let Some(blob) = obj.as_blob() {
                let content = String::from_utf8_lossy(blob.content()).to_string();
                Json(serde_json::json!({
                    "content": content,
                    "size": blob.size(),
                    "name": path.split('/').last().unwrap_or(&path),
                })).into_response()
            } else {
                StatusCode::BAD_REQUEST.into_response()
            }
        }
        Err(_) => StatusCode::NOT_FOUND.into_response(),
    }
}

async fn list_commits(
    State(state): State<Arc<AppState>>,
    Path((user, repo)): Path<(String, String)>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Response {
    let r = match state.open_repo(&user, &repo) {
        Ok(r) => r,
        Err(s) => return s.into_response(),
    };

    let head = match r.head() {
        Ok(h) => h,
        Err(_) => return Json(Vec::<CommitInfo>::new()).into_response(),
    };

    let limit: usize = params.get("limit").and_then(|s| s.parse().ok()).unwrap_or(50);
    let mut revwalk = r.revwalk().unwrap();
    revwalk.push(head.target().unwrap()).unwrap();
    revwalk.set_sorting(Sort::TIME).unwrap();

    let now = chrono::Utc::now().timestamp();
    let commits: Vec<CommitInfo> = revwalk
        .take(limit)
        .filter_map(|oid| oid.ok())
        .filter_map(|oid| r.find_commit(oid).ok())
        .map(|c| {
            let sha = c.id().to_string();
            let short_sha = sha[..7].to_string();
            let secs_ago = now - c.time().seconds();
            CommitInfo {
                sha,
                short_sha,
                message: c.message().unwrap_or("").trim().to_string(),
                author: c.author().name().unwrap_or("").to_string(),
                email: c.author().email().unwrap_or("").to_string(),
                date: chrono::DateTime::from_timestamp(c.time().seconds(), 0)
                    .map(|d| d.to_rfc3339())
                    .unwrap_or_default(),
                relative_date: relative_time(secs_ago),
            }
        })
        .collect();

    Json(commits).into_response()
}

async fn get_commit(
    State(state): State<Arc<AppState>>,
    Path((user, repo, sha)): Path<(String, String, String)>,
) -> Response {
    let r = match state.open_repo(&user, &repo) {
        Ok(r) => r,
        Err(s) => return s.into_response(),
    };

    let oid = match resolve_sha(&r, &sha) {
        Some(o) => o,
        None => return StatusCode::NOT_FOUND.into_response(),
    };

    let commit = match r.find_commit(oid) {
        Ok(c) => c,
        Err(_) => return StatusCode::NOT_FOUND.into_response(),
    };

    let full_sha = commit.id().to_string();
    let now = chrono::Utc::now().timestamp();
    let secs_ago = now - commit.time().seconds();
    let author = commit.author().name().unwrap_or("").to_string();
    let email = commit.author().email().unwrap_or("").to_string();
    let message = commit.message().unwrap_or("").trim().to_string();
    let date = chrono::DateTime::from_timestamp(commit.time().seconds(), 0)
        .map(|d| d.to_rfc3339())
        .unwrap_or_default();

    Json(CommitInfo {
        sha: full_sha.clone(),
        short_sha: full_sha[..7].to_string(),
        message,
        author,
        email,
        date,
        relative_date: relative_time(secs_ago),
    }).into_response()
}

fn resolve_sha(repo: &Repository, sha: &str) -> Option<Oid> {
    if let Ok(oid) = Oid::from_str(sha) {
        return Some(oid);
    }
    repo.revparse_single(sha).ok().map(|o| o.id())
}

async fn get_diff(
    State(state): State<Arc<AppState>>,
    Path((user, repo, sha)): Path<(String, String, String)>,
) -> Response {
    let r = match state.open_repo(&user, &repo) {
        Ok(r) => r,
        Err(s) => return s.into_response(),
    };

    let oid = match resolve_sha(&r, &sha) {
        Some(o) => o,
        None => return StatusCode::NOT_FOUND.into_response(),
    };

    let commit = match r.find_commit(oid) {
        Ok(c) => c,
        Err(_) => return StatusCode::NOT_FOUND.into_response(),
    };

    let new_tree = commit.tree().unwrap();
    let old_tree = commit.parent(0).ok().map(|p| p.tree().unwrap());

    let mut opts = DiffOptions::new();
    let diff = r
        .diff_tree_to_tree(old_tree.as_ref(), Some(&new_tree), Some(&mut opts))
        .unwrap();

    let mut files: Vec<DiffFileInfo> = Vec::new();
    let mut current_file_path = String::new();

    diff.print(git2::DiffFormat::Patch, |delta, hunk, line| {
        let new_path = delta.new_file().path().map(|p| p.to_string_lossy().to_string()).unwrap_or_default();
        if new_path != current_file_path {
            current_file_path = new_path.clone();
            let status = match delta.status() {
                git2::Delta::Added => "added",
                git2::Delta::Deleted => "deleted",
                git2::Delta::Modified => "modified",
                git2::Delta::Renamed => "renamed",
                _ => "modified",
            };
            files.push(DiffFileInfo {
                old_path: delta.old_file().path().map(|p| p.to_string_lossy().to_string()).unwrap_or_default(),
                new_path,
                status: status.to_string(),
                additions: 0,
                deletions: 0,
                hunks: Vec::new(),
            });
        }

        match line.origin() {
            'H' => {
                if let Some(file) = files.last_mut() {
                    let header = hunk.map(|h| std::str::from_utf8(h.header()).unwrap_or("").trim().to_string()).unwrap_or_default();
                    file.hunks.push(DiffHunkInfo { header, lines: Vec::new() });
                }
            }
            '+' => {
                if let Some(file) = files.last_mut() {
                    file.additions += 1;
                    if let Some(h) = file.hunks.last_mut() {
                        h.lines.push(DiffLineInfo {
                            kind: "add".into(),
                            content: std::str::from_utf8(line.content()).unwrap_or("").trim_end_matches('\n').to_string(),
                            old_num: None,
                            new_num: line.new_lineno(),
                        });
                    }
                }
            }
            '-' => {
                if let Some(file) = files.last_mut() {
                    file.deletions += 1;
                    if let Some(h) = file.hunks.last_mut() {
                        h.lines.push(DiffLineInfo {
                            kind: "delete".into(),
                            content: std::str::from_utf8(line.content()).unwrap_or("").trim_end_matches('\n').to_string(),
                            old_num: line.old_lineno(),
                            new_num: None,
                        });
                    }
                }
            }
            ' ' => {
                if let Some(file) = files.last_mut() {
                    if let Some(h) = file.hunks.last_mut() {
                        h.lines.push(DiffLineInfo {
                            kind: "context".into(),
                            content: std::str::from_utf8(line.content()).unwrap_or("").trim_end_matches('\n').to_string(),
                            old_num: line.old_lineno(),
                            new_num: line.new_lineno(),
                        });
                    }
                }
            }
            _ => {}
        }
        true
    }).unwrap();

    Json(files).into_response()
}

async fn get_diff_stats(
    State(state): State<Arc<AppState>>,
    Path((user, repo, sha)): Path<(String, String, String)>,
) -> Response {
    let r = match state.open_repo(&user, &repo) {
        Ok(r) => r,
        Err(s) => return s.into_response(),
    };

    let oid = match resolve_sha(&r, &sha) {
        Some(o) => o,
        None => return StatusCode::NOT_FOUND.into_response(),
    };

    let commit = match r.find_commit(oid) {
        Ok(c) => c,
        Err(_) => return StatusCode::NOT_FOUND.into_response(),
    };

    let new_tree = commit.tree().unwrap();
    let old_tree = commit.parent(0).ok().map(|p| p.tree().unwrap());

    let diff = r.diff_tree_to_tree(old_tree.as_ref(), Some(&new_tree), None).unwrap();
    let stats = diff.stats().unwrap();

    Json(DiffStats {
        files: stats.files_changed(),
        additions: stats.insertions(),
        deletions: stats.deletions(),
    }).into_response()
}

async fn list_branches(
    State(state): State<Arc<AppState>>,
    Path((user, repo)): Path<(String, String)>,
) -> Response {
    let r = match state.open_repo(&user, &repo) {
        Ok(r) => r,
        Err(s) => return s.into_response(),
    };

    let head_ref = r.head().ok().and_then(|h| h.target());

    let branches: Vec<BranchInfo> = r
        .branches(Some(git2::BranchType::Local))
        .map(|iter| {
            iter.filter_map(|b| b.ok())
                .map(|(branch, _)| {
                    let name = branch.name().ok().flatten().unwrap_or("").to_string();
                    let is_head = branch.get().target() == head_ref;
                    BranchInfo { name, is_head }
                })
                .collect()
        })
        .unwrap_or_default();

    Json(branches).into_response()
}

async fn get_contributions(
    State(state): State<Arc<AppState>>,
    Path(user): Path<String>,
) -> Response {
    let db = read_db(&state);
    let user_repos: Vec<&RepoRecord> = db.repos.iter().filter(|r| r.user == user).collect();

    let mut day_counts: std::collections::HashMap<String, usize> = std::collections::HashMap::new();

    for repo_record in &user_repos {
        let r = match state.open_repo(&user, &repo_record.name) {
            Ok(r) => r,
            Err(_) => continue,
        };

        let head = match r.head() {
            Ok(h) => h,
            Err(_) => continue,
        };

        let mut revwalk = r.revwalk().unwrap();
        revwalk.push(head.target().unwrap()).unwrap();

        for oid in revwalk.filter_map(|o| o.ok()) {
            if let Ok(commit) = r.find_commit(oid) {
                if let Some(dt) = chrono::DateTime::from_timestamp(commit.time().seconds(), 0) {
                    let day = dt.format("%Y-%m-%d").to_string();
                    *day_counts.entry(day).or_insert(0) += 1;
                }
            }
        }
    }

    let mut contributions: Vec<ContributionDay> = day_counts
        .into_iter()
        .map(|(date, count)| ContributionDay { date, count })
        .collect();
    contributions.sort_by(|a, b| a.date.cmp(&b.date));

    Json(contributions).into_response()
}

async fn health() -> &'static str {
    "forge-server ok"
}

#[tokio::main]
async fn main() {
    let data_dir = std::env::var("FORGE_DATA_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| {
            std::env::current_dir().unwrap().parent().unwrap().join("data")
        });

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(3001);

    println!("forge-server v0.1.0");
    println!("  data: {}", data_dir.display());
    println!("  port: {}", port);

    let state = Arc::new(AppState { data_dir });

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/git/{user}/{repo}/info/refs", get(info_refs))
        .route("/api/git/{user}/{repo}/{service}", post(git_service))
        .route("/api/repos", get(list_repos_handler))
        .route("/api/repos", post(create_repo_handler))
        .route("/api/repos/{user}/{repo}/tree", get(list_files))
        .route("/api/repos/{user}/{repo}/blob/{*path}", get(read_file))
        .route("/api/repos/{user}/{repo}/commits", get(list_commits))
        .route("/api/repos/{user}/{repo}/commits/{sha}", get(get_commit))
        .route("/api/repos/{user}/{repo}/commits/{sha}/diff", get(get_diff))
        .route("/api/repos/{user}/{repo}/commits/{sha}/stats", get(get_diff_stats))
        .route("/api/repos/{user}/{repo}/branches", get(list_branches))
        .route("/api/contributions/{user}", get(get_contributions))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port))
        .await
        .unwrap();
    println!("  listening on http://localhost:{}", port);
    axum::serve(listener, app).await.unwrap();
}
