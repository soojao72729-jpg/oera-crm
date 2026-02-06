# OERA Sales CRM - Desktop Build Instructions

Since this is a professional desktop application, you need to follow these 3 simple steps on your computer to create the `.exe` (Installer) file.

### 1. Install Node.js
If you don't have it already, download and install **Node.js** from [nodejs.org](https://nodejs.org/). This is the engine that runs the desktop software.

### 2. Prepare the Software
Open your folder in the terminal (Command Prompt or PowerShell) and run these two commands one by one:

```bash
# This installs the Desktop engine (Electron)
npm install

# This confirms the software is ready
npm start
```

### 3. Build the Installer (.exe)
To create the final installer that you can send to your workers, run this command:

```bash
npm run build
```

Once finished, a new folder named `dist` will appear. Inside it, you will find:
- **OERA Sales Setup.exe** (The installer file)
- **OERA Sales.exe** (Portable version - no installation needed)

---
### Manual Update Workflow
- **Admin**: Make changes, `npm run build`, and send the new `.exe` to workers.
- **Workers**: Use the software, click **"Generate Backup File"** in the **Sync Center**, and send the file to Admin.
- **Admin**: Click **"Import"** in the **Sync Center** to update the master data.
