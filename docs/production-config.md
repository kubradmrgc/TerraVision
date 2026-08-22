# Production configuration (secrets and SQL Server)

Use environment variables or a secret manager instead of committing secrets. ASP.NET Core binds hierarchical configuration using double underscores (`__`).

## JWT

Set a strong signing secret (preferably at least 32 characters):

```bash
# Linux/macOS shell
export JwtSettings__Secret="your-production-secret-at-least-32-chars"

# Windows PowerShell
$env:JwtSettings__Secret = "your-production-secret-at-least-32-chars"
```

Locally during development you can use User Secrets:

```bash
dotnet user-secrets init --project TerraVision.Api.csproj
dotnet user-secrets set "JwtSettings:Secret" "your-dev-secret" --project TerraVision.Api.csproj
```

## Database connection string

Override the SQL Server connection string for production hosts:

```bash
export ConnectionStrings__DefaultConnection="Server=tcp:YOUR_HOST;Database=TerraVisionDb;User Id=...;Password=...;Encrypt=True;TrustServerCertificate=False;MultipleActiveResultSets=true"
```

### Encryption and certificate trust

- **Production:** Prefer `Encrypt=True` with `TrustServerCertificate=False`, and install a CA-trusted certificate on SQL Server so clients validate the server TLS certificate.
- **Local development:** `TrustServerCertificate=True` (as in the default `appsettings.json`) avoids self-signed certificate friction but is not appropriate for production.

## Redis (optional)

If Redis is not available, the API falls back to an in-memory distributed cache; set only when you run Redis:

```bash
export ConnectionStrings__Redis="your-redis-host:6379"
```
