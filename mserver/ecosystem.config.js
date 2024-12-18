module.exports = {
    apps: [
        {
            name: "inventory-management",
            script: "npm",
            args: "run dev",
            env: {
                NODE_ENV: "development",
                END_VAR1: "environment-variable",
            }
        }
    ]
}