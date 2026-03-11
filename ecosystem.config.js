module.exports = {
  apps: [
    {
      name: 'app',
      script: '/var/www/app.danielbeardsley/bin/www',
      cwd: '/var/www/app.danielbeardsley',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      }
    }
  ]
};
