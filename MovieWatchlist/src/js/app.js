const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let titles = [];
let currentView = "dashboard";
let activeType = "All";
let searchTerm = "";
let toastTimer;

const statusClass = (status) => status.toLowerCase().replaceAll(" ", "-");
const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

function notify(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function posterMarkup(item) {
  const safeTitle = escapeHTML(item.title);
  const hasPoster = item.poster && /^https?:\/\//i.test(item.poster);
  const poster = hasPoster
    ? `<img src="${escapeHTML(item.poster)}" alt="${safeTitle} poster" onerror="this.remove();this.parentElement.querySelector('.poster-placeholder').classList.remove('hidden')">`
    : "";
  return `<div class="poster-wrap">
    ${poster}
    <div class="poster-placeholder${hasPoster ? " hidden" : ""}"><span>▣</span><small>${safeTitle}</small></div>
    <div class="poster-overlay">
      <button class="mini-action" data-edit="${escapeHTML(item.id)}" title="Edit">✎</button>
      <button class="mini-action" data-favorite="${escapeHTML(item.id)}" title="Toggle favorite">${item.favorite ? "♥" : "♡"}</button>
      <button class="mini-action" data-delete="${escapeHTML(item.id)}" title="Delete">×</button>
    </div>
  </div>`;
}

function cardMarkup(item) {
  const progress = item.type === "Series" && item.episode > 0
    ? `<div class="poster-meta">S${item.season || 1} · Episode ${item.episode}${item.totalEpisodes ? ` / ${item.totalEpisodes}` : ""}</div>` : "";
  return `<article class="poster-card">
    ${posterMarkup(item)}
    <div class="poster-info">
      <div style="min-width:0"><h3 title="${escapeHTML(item.title)}">${escapeHTML(item.title)}</h3>
      <div class="poster-meta">${escapeHTML(item.type)}${item.year ? ` · ${item.year}` : ""}</div></div>
      ${item.rating ? `<span class="poster-rating">★ ${Number(item.rating).toFixed(1)}</span>` : ""}
    </div>
    ${progress}
    <span class="status-pill ${statusClass(item.status)}">${escapeHTML(item.status)}</span>
  </article>`;
}

function updateStats() {
  $("#stat-total").textContent = titles.length;
  $("#stat-plan").textContent = titles.filter(t => t.status === "Plan to Watch").length;
  $("#stat-watching").textContent = titles.filter(t => t.status === "Watching").length;
  $("#stat-completed").textContent = titles.filter(t => t.status === "Completed").length;
}

function renderDashboard() {
  updateStats();
  const recent = [...titles].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  $("#recent-grid").innerHTML = recent.map(cardMarkup).join("");
  $("#recent-grid").classList.toggle("hidden", recent.length === 0);
  $("#dashboard-empty").classList.toggle("hidden", titles.length > 0);
}

function viewTitles() {
  let list = [...titles];
  if (currentView === "watchlist") list = list.filter(t => t.status === "Plan to Watch");
  if (currentView === "watching") list = list.filter(t => t.status === "Watching");
  if (currentView === "completed") list = list.filter(t => t.status === "Completed");
  if (currentView === "favorites") list = list.filter(t => t.favorite);
  if (activeType !== "All") list = list.filter(t => t.type === activeType);
  const genre = $("#genre-filter").value;
  if (genre !== "All") list = list.filter(t => t.genre === genre);
  if (searchTerm) list = list.filter(t => `${t.title} ${t.genre} ${t.type} ${t.notes}`.toLowerCase().includes(searchTerm));
  const sort = $("#sort-filter").value;
  if (sort === "az") list.sort((a,b) => a.title.localeCompare(b.title));
  if (sort === "rating") list.sort((a,b) => b.rating - a.rating);
  if (sort === "year") list.sort((a,b) => (b.year || 0) - (a.year || 0));
  if (sort === "recent") list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  return list;
}

function renderLibrary() {
  const names = {
    all: ["All titles", "Every movie and series in your collection."],
    watchlist: ["Plan to watch", "Titles you've saved for later."],
    watching: ["Currently watching", "Pick up where you left off."],
    completed: ["Completed", "Everything you've finished."],
    favorites: ["Favorites", "The titles you love most."]
  };
  const [heading, sub] = names[currentView] || names.all;
  $("#library-title").innerHTML = `${heading}<span class="heading-period">.</span>`;
  $("#library-subtitle").textContent = sub;
  const list = viewTitles();
  $("#library-grid").innerHTML = list.map(cardMarkup).join("");
  $("#library-empty").classList.toggle("hidden", list.length > 0);
  $("#library-grid").classList.toggle("hidden", list.length === 0);
  $("#type-tabs").classList.toggle("hidden", currentView !== "all");
}

function render() {
  $("#dashboard-view").classList.toggle("hidden", currentView !== "dashboard");
  $("#library-view").classList.toggle("hidden", currentView === "dashboard");
  $("#crumb-title").textContent = currentView === "dashboard" ? "Dashboard" : ({
    all:"All titles",watchlist:"Plan to watch",watching:"Watching",completed:"Completed",favorites:"Favorites"
  }[currentView]);
  $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === currentView));
  renderDashboard();
  if (currentView !== "dashboard") renderLibrary();
}

function populateGenres() {
  const select = $("#genre-filter");
  const previous = select.value;
  const genres = [...new Set(titles.map(t => t.genre).filter(Boolean))].sort();
  select.innerHTML = `<option value="All">All genres</option>${genres.map(g => `<option value="${escapeHTML(g)}">${escapeHTML(g)}</option>`).join("")}`;
  select.value = genres.includes(previous) ? previous : "All";
}

function openModal(item = null) {
  $("#title-form").reset();
  $("#field-id").value = item?.id || "";
  $("#field-title").value = item?.title || "";
  $("#field-type").value = item?.type || "Movie";
  $("#field-status").value = item?.status || "Plan to Watch";
  $("#field-genre").value = item?.genre || "Action";
  $("#field-year").value = item?.year || "";
  $("#field-rating").value = item?.rating || "";
  $("#field-poster").value = item?.poster || "";
  $("#field-notes").value = item?.notes || "";
  $("#field-favorite").checked = Boolean(item?.favorite);
  $("#field-season").value = item?.season || "";
  $("#field-episode").value = item?.episode || "";
  $("#field-total-episodes").value = item?.totalEpisodes || "";
  $("#modal-title").textContent = item ? "Edit title" : "Add a title";
  $("#save-title-btn").textContent = item ? "Save changes" : "Save title";
  $("#series-fields").classList.toggle("hidden", $("#field-type").value !== "Series");
  $("#title-modal").classList.remove("hidden");
  $("#field-title").focus();
}

function closeModal() { $("#title-modal").classList.add("hidden"); }

async function saveForm(event) {
  event.preventDefault();
  const title = {
    id: $("#field-id").value || undefined,
    title: $("#field-title").value,
    type: $("#field-type").value,
    status: $("#field-status").value,
    genre: $("#field-genre").value,
    year: $("#field-year").value,
    rating: $("#field-rating").value,
    poster: $("#field-poster").value,
    notes: $("#field-notes").value,
    favorite: $("#field-favorite").checked,
    season: $("#field-season").value,
    episode: $("#field-episode").value,
    totalEpisodes: $("#field-total-episodes").value,
    createdAt: titles.find(t => t.id === $("#field-id").value)?.createdAt
  };
  try {
    await window.watchlistAPI.save(title);
    await loadTitles();
    closeModal();
    notify(title.id ? "Changes saved." : "Title added to your library.");
  } catch (error) {
    notify(error.message || "Could not save this title.");
  }
}

async function loadTitles() {
  titles = await window.watchlistAPI.list();
  populateGenres();
  render();
}

async function handleCardAction(event) {
  const editId = event.target.closest("[data-edit]")?.dataset.edit;
  const deleteId = event.target.closest("[data-delete]")?.dataset.delete;
  const favoriteId = event.target.closest("[data-favorite]")?.dataset.favorite;
  if (editId) {
    const item = titles.find(t => t.id === editId);
    if (item) openModal(item);
  } else if (deleteId) {
    const item = titles.find(t => t.id === deleteId);
    if (item && confirm(`Delete "${item.title}" from your library?`)) {
      await window.watchlistAPI.remove(deleteId);
      await loadTitles();
      notify("Title deleted.");
    }
  } else if (favoriteId) {
    const item = titles.find(t => t.id === favoriteId);
    if (item) {
      await window.watchlistAPI.save({...item, favorite: !item.favorite});
      await loadTitles();
      notify(item.favorite ? "Removed from favorites." : "Added to favorites.");
    }
  }
}

function navigate(view) {
  currentView = view;
  activeType = "All";
  $$("#type-tabs button").forEach(b => b.classList.toggle("selected", b.dataset.type === "All"));
  render();
}

document.addEventListener("DOMContentLoaded", async () => {
  $("#today-date").textContent = new Intl.DateTimeFormat(undefined, {weekday:"short", month:"short", day:"numeric", year:"numeric"}).format(new Date());
  await loadTitles();

  $$(".nav-item").forEach(button => button.addEventListener("click", () => navigate(button.dataset.view)));
  $("#add-title-btn").addEventListener("click", () => openModal());
  $$("[data-add]").forEach(button => button.addEventListener("click", () => openModal()));
  $$("[data-goto]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.goto)));
  $("#close-modal").addEventListener("click", closeModal);
  $("#cancel-modal").addEventListener("click", closeModal);
  $("#title-form").addEventListener("submit", saveForm);
  $("#field-type").addEventListener("change", () => $("#series-fields").classList.toggle("hidden", $("#field-type").value !== "Series"));
  $("#title-modal").addEventListener("click", event => { if (event.target.id === "title-modal") closeModal(); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      $("#global-search").focus();
    }
  });
  $("#global-search").addEventListener("input", event => {
    searchTerm = event.target.value.trim().toLowerCase();
    if (searchTerm && currentView === "dashboard") navigate("all");
    if (currentView !== "dashboard") renderLibrary();
  });
  $("#genre-filter").addEventListener("change", renderLibrary);
  $("#sort-filter").addEventListener("change", renderLibrary);
  $$("#type-tabs button").forEach(button => button.addEventListener("click", () => {
    activeType = button.dataset.type;
    $$("#type-tabs button").forEach(b => b.classList.toggle("selected", b === button));
    renderLibrary();
  }));
  document.addEventListener("click", event => {
    if (event.target.closest("[data-edit], [data-delete], [data-favorite]")) handleCardAction(event);
  });
});