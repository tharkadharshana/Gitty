const { execSync } = require('child_process');
const os = require('os');

const ports = process.argv.slice(2);

if (ports.length === 0) {
    console.log('No ports specified to kill.');
    process.exit(0);
}

const isWindows = os.platform() === 'win32';

ports.forEach(port => {
    try {
        console.log(`Checking port ${port}...`);
        if (isWindows) {
            // Find PID on Windows
            const stdout = execSync(`netstat -ano | findstr :${port}`).toString();
            const lines = stdout.trim().split('\n');
            const pids = new Set();

            lines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length > 4) {
                    const pid = parts[parts.length - 1];
                    if (pid !== '0' && !isNaN(pid)) {
                        pids.add(pid);
                    }
                }
            });

            pids.forEach(pid => {
                console.log(`Killing process ${pid} on port ${port}...`);
                try {
                    execSync(`taskkill /F /PID ${pid}`);
                } catch (e) {
                    // Ignore errors if process already exited
                }
            });
        } else {
            // Find PID on Linux/macOS
            try {
                const pid = execSync(`lsof -t -i:${port}`).toString().trim();
                if (pid) {
                    console.log(`Killing process ${pid} on port ${port}...`);
                    execSync(`kill -9 ${pid}`);
                }
            } catch (e) {
                // lsof returns non-zero exit code if no process found
            }
        }
    } catch (error) {
        // Port might not be in use
        console.log(`Port ${port} is free or could not be checked.`);
    }
});
