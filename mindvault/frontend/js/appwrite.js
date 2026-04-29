(() => {
  if (!window.Appwrite) {
    throw new Error("Appwrite SDK not loaded. Ensure the Appwrite CDN script is included before appwrite.js.");
  }

  const cfg = window.__MINDVAULT__ || {};

  const endpoint = cfg.appwriteEndpoint || "https://cloud.appwrite.io/v1";
  const projectId = cfg.appwriteProjectId || "";
  const databaseId = cfg.appwriteDatabaseId || "";
  const dumpsCollectionId = cfg.appwriteDumpsCollectionId || "";

  function requireConfig() {
    const missing = [];
    if (!projectId) missing.push("appwriteProjectId");
    if (!databaseId) missing.push("appwriteDatabaseId");
    if (!dumpsCollectionId) missing.push("appwriteDumpsCollectionId");
    if (missing.length) {
      throw new Error(
        `Appwrite is not configured (${missing.join(
          ", "
        )}). Set these in window.__MINDVAULT__ or edit frontend/js/appwrite.js. See mindvault/APPWRITE_SETUP.md.`
      );
    }
  }

  const client = new window.Appwrite.Client().setEndpoint(endpoint).setProject(projectId);
  const account = new window.Appwrite.Account(client);
  const databases = new window.Appwrite.Databases(client);

  window.MindVaultAppwrite = {
    requireConfig,
    client,
    account,
    databases,
    IDs: window.Appwrite.ID,
    Query: window.Appwrite.Query,
    Permission: window.Appwrite.Permission,
    Role: window.Appwrite.Role,
    cfg: { endpoint, projectId, databaseId, dumpsCollectionId },
  };
})();

