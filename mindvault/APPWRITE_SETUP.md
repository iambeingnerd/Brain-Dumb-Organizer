# MindVault → Appwrite Cloud setup

## 1) Create Appwrite resources

In the Appwrite Console (Cloud):

- Create a **Project** (any name).
- Go to **Auth** → enable **Email/Password**.
- Go to **Databases**:
  - Create a **Database** (e.g. `mindvault_db`).
  - Create a **Collection** named `dumps`.

### Collection attributes (recommended)

Create these attributes in `dumps`:

- `raw_text` (String, required)
- `tasks` (String array, optional)
- `ideas` (String array, optional)
- `worries` (String array, optional)
- `notes` (String array, optional)
- `clarity_score` (Integer, optional)

You can rely on Appwrite system fields:

- `$id`
- `$createdAt`

### Collection permissions

Set **Collection-level permissions** to something permissive enough for document creation, then enforce per-user access with **document permissions** (MindVault sets these on create):

- Document permissions created by the app:
  - `read`: `user:{userId}`
  - `update`: `user:{userId}`
  - `delete`: `user:{userId}`

## 2) Configure the frontend

Open `mindvault/frontend/js/appwrite.js` and set:

- `projectId`
- `databaseId`
- `dumpsCollectionId`

Endpoint is defaulted to:

- `https://cloud.appwrite.io/v1`

## 3) Run locally

The backend is now just a static file server for the frontend:

```bash
cd mindvault/backend
pip install -r requirements.txt
python app.py
```

Open:

- `http://127.0.0.1:5000/`

