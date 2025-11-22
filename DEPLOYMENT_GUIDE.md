# LogiTrack Deployment Guide

Complete guide for deploying LogiTrack to Google Cloud Platform.

## Prerequisites

1. **Google Cloud Account**
   - Active GCP project
   - Billing enabled
   - Required APIs enabled (see below)

2. **Local Tools**
   - `gcloud` CLI installed and configured
   - `terraform` >= 1.0
   - `docker` (for local testing)
   - `node.js` 20+ (for local development)

## Step 1: Enable Required GCP APIs

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  servicenetworking.googleapis.com \
  compute.googleapis.com
```

## Step 2: Create Service Account

```bash
# Create service account
gcloud iam service-accounts create logitrack-deploy \
  --display-name="LogiTrack Deployment Service Account"

# Grant necessary roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:logitrack-deploy@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:logitrack-deploy@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:logitrack-deploy@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:logitrack-deploy@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:logitrack-deploy@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/compute.networkAdmin"

# Create and download key
gcloud iam service-accounts keys create gcp-sa-key.json \
  --iam-account=logitrack-deploy@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

## Step 3: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

1. **GCP_PROJECT_ID**: Your GCP project ID
2. **GCP_SA_KEY**: Contents of `gcp-sa-key.json` file (entire JSON)
3. **DB_PASSWORD**: Strong password for PostgreSQL database
4. **JWT_SECRET**: Random string (minimum 32 characters) for JWT tokens
5. **CORS_ORIGIN**: Your frontend URL (e.g., `https://app.mrtcpvtltd.in`)

## Step 4: Create Terraform State Bucket

```bash
gsutil mb -p YOUR_PROJECT_ID -l us-central1 gs://YOUR_PROJECT_ID-terraform-state
gsutil versioning set on gs://YOUR_PROJECT_ID-terraform-state
```

## Step 5: Configure Terraform Variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
project_id = "your-gcp-project-id"
region     = "us-central1"
db_tier    = "db-f1-micro"  # Use db-n1-standard-1 for production
db_user    = "postgres"
db_password = "your-secure-password"
jwt_secret = "your-jwt-secret-key-min-32-chars"
cors_origin = "https://your-frontend-domain.com"
```

## Step 6: Initialize and Apply Terraform

```bash
cd terraform

# Initialize Terraform
terraform init \
  -backend-config="bucket=YOUR_PROJECT_ID-terraform-state" \
  -backend-config="prefix=terraform/state"

# Review plan
terraform plan

# Apply infrastructure
terraform apply
```

This will create:
- CloudSQL PostgreSQL instance
- Cloud Run service
- Artifact Registry
- VPC network
- Secret Manager secrets
- IAM roles

## Step 7: Run Database Migrations

After Terraform completes, run the database migrations:

```bash
# Option 1: Using Cloud SQL Proxy (local)
cloud_sql_proxy -instances=YOUR_PROJECT_ID:us-central1:YOUR_PROJECT_ID-db=tcp:5432

# In another terminal
cd backend
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=logitrack
export DB_USER=postgres
export DB_PASSWORD=your-password
npm run migrate

# Option 2: Using Cloud Run Job (recommended for production)
# Create a Cloud Run job that runs migrations
```

## Step 8: Deploy Backend via GitHub Actions

1. Push your code to the `main` branch
2. GitHub Actions will automatically:
   - Build Docker image
   - Push to Artifact Registry
   - Run Terraform to update Cloud Run
   - Deploy new version

## Step 9: Set Up Custom Domain

1. Go to Cloud Run console
2. Select `logitrack-backend` service
3. Click "Manage Custom Domains"
4. Add your domain (e.g., `api.mrtcpvtltd.in`)
5. Follow DNS configuration instructions
6. Update `CORS_ORIGIN` in GitHub secrets to match

## Step 10: Update Frontend Configuration

Update your frontend to use the new backend API:

```typescript
// In your frontend code, replace mockApi.ts with real API calls
const API_BASE_URL = process.env.VITE_API_URL || 'https://api.mrtcpvtltd.in/api';
```

## Monitoring and Maintenance

### View Logs
```bash
gcloud run services logs read logitrack-backend --region=us-central1
```

### Database Backup
CloudSQL automatic backups are enabled. Manual backup:
```bash
gcloud sql backups create --instance=YOUR_PROJECT_ID-db
```

### Scale Cloud Run
Update in Terraform or Cloud Console:
- Min instances: 1
- Max instances: 10
- CPU: 2
- Memory: 2Gi

### Update Secrets
```bash
# Update DB password
echo -n "new-password" | gcloud secrets versions add db-password --data-file=-

# Update JWT secret
echo -n "new-jwt-secret" | gcloud secrets versions add jwt-secret --data-file=-
```

## Troubleshooting

### Connection Issues
- Verify CloudSQL instance is running
- Check VPC connector configuration
- Verify service account permissions

### Migration Errors
- Ensure database user has CREATE privileges
- Check connection string format
- Verify network connectivity

### Deployment Failures
- Check GitHub Actions logs
- Verify all secrets are set
- Check Terraform state

## Cost Optimization

- Use `db-f1-micro` for development (free tier eligible)
- Use `db-n1-standard-1` for production
- Enable Cloud Run min instances = 0 for cost savings (adds cold start)
- Use Cloud SQL automatic backups (7 days retention)

## Security Checklist

- [ ] Strong database password (16+ characters)
- [ ] JWT secret is random and secure
- [ ] CORS origin is specific (not `*`)
- [ ] Cloud Run service is not publicly accessible (use IAM)
- [ ] Secrets are stored in Secret Manager
- [ ] Database has deletion protection enabled
- [ ] Regular security updates

## Support

For issues or questions, refer to:
- Backend README: `backend/README.md`
- Terraform documentation: `terraform/README.md`
- GCP documentation: https://cloud.google.com/docs

