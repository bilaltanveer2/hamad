const { execSync } = require('child_process');
try {
    console.log('Running prisma generate...');
    const gen = execSync('npx prisma generate', { stdio: 'pipe' });
    console.log(gen.toString());

    console.log('Running prisma db push...');
    const push = execSync('npx prisma db push', { stdio: 'pipe' });
    console.log(push.toString());
} catch (e) {
    console.log('--- ERROR ---');
    if (e.stdout) console.log(e.stdout.toString());
    if (e.stderr) console.log(e.stderr.toString());
    console.log(e.message);
}
