# Backing up and restoring LA Consolacion Jewelry

A full backup has **two parts**. You need both:

| Part | What is in it | Where it lives |
|---|---|---|
| The **`lcj` database** | Orders, customers, payments, products, users, logs | XAMPP MySQL |
| The **uploaded pictures** | Payment screenshots, profile photos, product and custom-order pictures | `backend/uploads/` |

The pictures are not on GitHub (`.gitignore` leaves them out), and the database only stores their file names.
A database backup on its own brings the orders back, but without their payment screenshots.

**When to back up**
- Before every migration (a file from `database/migrations/`)
- Before installing a new release
- Regularly, for example once a week, while the shop has data you care about

**Where to keep backups**
- In a folder outside the project, for example `D:\LCJ-backups`, so they are never committed by mistake.
- Copy them somewhere off the PC too (a USB drive or Google Drive). A backup on the same disk is lost with the disk.
- Backups hold customers' names, emails, mobile numbers, addresses and password hashes. Never upload them to GitHub or share them.

The commands below assume XAMPP is in `C:\xampp` and the project is in `D:\La Consolacion`.
If yours are somewhere else, change those paths. MySQL must be running in the XAMPP Control Panel.

---

## 1. Back up

### Option A: phpMyAdmin (database only)
1. Open phpMyAdmin and click **`lcj`** in the left list.
2. Open the **Export** tab.
3. Leave **Export method: Quick** and **Format: SQL**, and click **Export** (on some versions, **Go**).
4. Your browser downloads `lcj.sql`. Move it to `D:\LCJ-backups` and rename it with the date, for example `lcj_2026-11-25.sql`.

Then back up the pictures with the `Compress-Archive` line in Option B.

### Option B: PowerShell (database and pictures)
Paste this into PowerShell. It makes a dated `.sql` file and a dated `.zip` of the pictures:

```powershell
$folder = "D:\LCJ-backups"
New-Item -ItemType Directory -Force -Path $folder | Out-Null
$date = Get-Date -Format "yyyy-MM-dd_HHmm"

# The database
& "C:\xampp\mysql\bin\mysqldump.exe" -u root --single-transaction --default-character-set=utf8mb4 "--result-file=$folder\lcj_$date.sql" lcj

# The uploaded pictures
Compress-Archive -Path "D:\La Consolacion\backend\uploads\*" -DestinationPath "$folder\lcj-uploads_$date.zip"

Get-ChildItem $folder
```

You should see two new files, `lcj_<date>.sql` and `lcj-uploads_<date>.zip`, and neither should be 0 KB.

> **Use `--result-file`, not `>`.** In Windows PowerShell, `mysqldump ... > file.sql` saves the file as UTF-16,
> which MySQL cannot read back. `--result-file` keeps it as normal UTF-8.

If your MySQL `root` user has a password, add `-p` after `-u root`. It asks for the password instead of you typing it in the command.

---

## 2. Check that a backup works (test restore)

Do this once after your first backup, and now and then afterwards. It restores into a **separate test database**,
so your real `lcj` is not touched.

```powershell
$mysql = "C:\xampp\mysql\bin\mysql.exe"
$file  = "D:/LCJ-backups/lcj_2026-11-25_0930.sql"   # your backup file; use / instead of \

& $mysql -u root -e "CREATE DATABASE lcj_restore_test CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci"
& $mysql -u root --default-character-set=utf8mb4 lcj_restore_test -e "source $file"
```

Now compare the two databases. Run this query in phpMyAdmin (SQL tab) on **`lcj`**, then on **`lcj_restore_test`**:

```sql
SELECT (SELECT COUNT(*) FROM users)       AS users,
       (SELECT COUNT(*) FROM orders)      AS orders,
       (SELECT COUNT(*) FROM order_items) AS items,
       (SELECT COUNT(*) FROM payments)    AS payments,
       (SELECT COUNT(*) FROM products)    AS products,
       (SELECT COUNT(*) FROM logs)        AS logs;
```

The numbers should be the same (unless orders came in after the backup). Also open one order in `lcj_restore_test`
and check that names with `ñ` and the `₱` sign look right.

When you are done, delete the test database:

```powershell
& $mysql -u root -e "DROP DATABASE lcj_restore_test"
```

To check the pictures backup, open the `.zip` in File Explorer. It should have the folders `products`, `custom`, `payments` and `profile`.

---

## 3. Restore for real

Only do this when the `lcj` database is broken or lost. Restoring **replaces everything** in `lcj` with the backup,
so orders made after the backup are lost.

1. **First, back up what is there now** (section 1), even if it looks broken. Then you can always go back.
2. Stop the API (`php -S ...`) so nobody uses the site during the restore.
3. Replace the database, with **one** of these:
   - **phpMyAdmin:** click **`lcj`** → **Operations** → **Drop the database (DROP)** → OK.
     Then **New** → name `lcj`, collation `utf8mb4_general_ci` → **Create**.
     With `lcj` selected, open **Import**, choose the backup `.sql` file and click **Import** (or **Go**).
   - **PowerShell:**
     ```powershell
     $mysql = "C:\xampp\mysql\bin\mysql.exe"
     $file  = "D:/LCJ-backups/lcj_2026-11-25_0930.sql"
     & $mysql -u root -e "DROP DATABASE lcj; CREATE DATABASE lcj CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci"
     & $mysql -u root --default-character-set=utf8mb4 lcj -e "source $file"
     ```
4. Put the pictures back:
   ```powershell
   Expand-Archive -Path "D:\LCJ-backups\lcj-uploads_2026-11-25_0930.zip" -DestinationPath "D:\La Consolacion\backend\uploads" -Force
   ```
5. If the backup is older than a migration, run the migrations you are missing (README, "Updating an existing database").
   For example, a backup from v1.4.0 needs `2026-11-23-delivery-address.sql`.
6. Start the API again, log in to the admin and open a few orders, including their payment screenshots.

---

## Problems

| You see | What to do |
|---|---|
| `... is not recognized as the name of a cmdlet` | XAMPP is not in `C:\xampp`. Find `mysqldump.exe` in your XAMPP folder (`mysql\bin`) and use that path. |
| `Can't connect to MySQL server` | Start **MySQL** in the XAMPP Control Panel. |
| `Access denied for user 'root'` | Your `root` has a password: add `-p` after `-u root`. |
| phpMyAdmin import: `Table ... already exists` | The `lcj` database was not empty. Drop it and create it again (section 3, step 3). |
| phpMyAdmin import: the file is too large | The Import page shows the largest file it accepts. Use the PowerShell restore instead. |
| `ERROR ... Unknown command '\-'` at line 1 | The `.sql` file was made by a newer MariaDB than XAMPP's. Open it in VS Code, delete the first line (`/*M!999999\- enable the sandbox mode */`) and try again. |
| Names show as `NiÃ±o` or `â‚±` | The file was saved or restored with the wrong character set. Make the backup again with the command above (`--result-file` and `utf8mb4`). |
