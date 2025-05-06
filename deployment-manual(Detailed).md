# ImageMedix Deployment Manual

## System Requirements

### Hardware Requirements
- **Server**: 
  - Minimum: 4 CPU cores, 8GB RAM, 100GB SSD
  - Recommended: 8 CPU cores, 16GB RAM, 250GB SSD
- **ML Server**: 
  - Minimum: 8 CPU cores, 16GB RAM, 100GB SSD, GPU with 8GB VRAM
  - Recommended: 16 CPU cores, 32GB RAM, 500GB SSD, GPU with 16GB VRAM

### Software Requirements
- **Operating System**: Ubuntu 20.04 LTS or later
- **Database**: MongoDB 4.4+
- **Node.js**: v16+
- **Python**: v3.8+
- **Docker**: v20+ (optional, for containerized deployment)
- **Redis**: v6+ (for job queue)

## Deployment Options

### Option 1: Manual Deployment

#### 1. Backend Deployment

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/imagemedix.git
   cd imagemedix/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration values:
   - Set `MONGODB_URI` to your MongoDB connection string
   - Generate a secure random string for `JWT_SECRET`
   - Set `ML_MODEL_API_KEY` to a secure API key
   - Configure other variables as needed

4. Start the server:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

#### 2. Frontend Deployment

1. Navigate to the frontend directory:
   ```bash
   cd ../code/imagemedix
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Edit the `.env.local` file with your configuration values:
   - Set `NEXT_PUBLIC_API_URL` to your backend API URL
   - Configure Clerk authentication variables
   - Set other variables as needed

4. Build and start the application:
   ```bash
   npm run build
   npm start
   ```

#### 3. ML Service Deployment

1. Navigate to the ML service directory:
   ```bash
   cd ../machine\ learning/brain
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration values:
   - Set `ML_MODEL_API_KEY` to match the key in the backend configuration
   - Configure model paths and other settings

5. Start the ML service:
   ```bash
   python app.py
   ```

### Option 2: Docker Deployment

1. Build the Docker images:
   ```bash
   # Backend
   cd backend
   docker build -t imagemedix-backend .
   
   # Frontend
   cd ../code/imagemedix
   docker build -t imagemedix-frontend .
   
   # ML Service
   cd ../machine\ learning/brain
   docker build -t imagemedix-ml .
   ```

2. Create a `docker-compose.yml` file:
   ```yaml
   version: '3'
   
   services:
     mongodb:
       image: mongo:4.4
       volumes:
         - mongodb_data:/data/db
       environment:
         - MONGO_INITDB_ROOT_USERNAME=admin
         - MONGO_INITDB_ROOT_PASSWORD=password
       restart: always
   
     redis:
       image: redis:6
       volumes:
         - redis_data:/data
       restart: always
   
     backend:
       image: imagemedix-backend
       depends_on:
         - mongodb
         - redis
       environment:
         - PORT=8080
         - MONGODB_URI=mongodb://admin:password@mongodb:27017/imagemedix?authSource=admin
         - REDIS_URL=redis://redis:6379
         - JWT_SECRET=your_jwt_secret
         - ML_MODEL_URL=http://ml-service:5000
         - ML_MODEL_API_KEY=your_api_key
       ports:
         - "8080:8080"
       restart: always
   
     frontend:
       image: imagemedix-frontend
       depends_on:
         - backend
       environment:
         - NEXT_PUBLIC_API_URL=http://backend:8080
       ports:
         - "3000:3000"
       restart: always
   
     ml-service:
       image: imagemedix-ml
       environment:
         - ML_MODEL_API_KEY=your_api_key
       volumes:
         - ml_models:/app/models
       ports:
         - "5000:5000"
       restart: always
   
   volumes:
     mongodb_data:
     redis_data:
     ml_models:
   ```

3. Start the services:
   ```bash
   docker-compose up -d
   ```

### Option 3: Cloud Deployment

#### AWS Deployment

1. **Backend**:
   - Deploy as an Elastic Beanstalk application
   - Use MongoDB Atlas or DocumentDB for the database
   - Use ElastiCache for Redis

2. **Frontend**:
   - Deploy to Amplify or S3 + CloudFront

3. **ML Service**:
   - Deploy to EC2 with GPU support or SageMaker

#### Azure Deployment

1. **Backend**:
   - Deploy to App Service
   - Use Cosmos DB for MongoDB
   - Use Azure Cache for Redis

2. **Frontend**:
   - Deploy to Static Web Apps

3. **ML Service**:
   - Deploy to Azure VM with GPU or Azure ML

## Security Configuration

### SSL/TLS Setup

1. Obtain SSL certificates:
   ```bash
   sudo apt-get update
   sudo apt-get install certbot
   sudo certbot certonly --standalone -d api.yourdomain.com
   ```

2. Configure Nginx as a reverse proxy:
   ```
   server {
       listen 443 ssl;
       server_name api.yourdomain.com;
       
       ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
       
       location / {
           proxy_pass http://localhost:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Firewall Configuration

1. Configure UFW (Uncomplicated Firewall):
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

## Monitoring and Maintenance

### Setting Up Monitoring

1. Install Prometheus and Grafana:
   ```bash
   # Install Prometheus
   wget https://github.com/prometheus/prometheus/releases/download/v2.37.0/prometheus-2.37.0.linux-amd64.tar.gz
   tar xvfz prometheus-2.37.0.linux-amd64.tar.gz
   
   # Install Grafana
   sudo apt-get install -y apt-transport-https software-properties-common
   wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
   echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list
   sudo apt-get update
   sudo apt-get install grafana
   ```

2. Configure Prometheus to scrape metrics from your services.

### Backup Strategy

1. Set up MongoDB backups:
   ```bash
   # Create a backup script
   mkdir -p /backups/mongodb
   
   cat > /usr/local/bin/backup-mongodb.sh << 'EOF'
   #!/bin/bash
   TIMESTAMP=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="/backups/mongodb"
   
   mongodump --uri="mongodb://admin:password@localhost:27017/imagemedix?authSource=admin" --out="$BACKUP_DIR/$TIMESTAMP"
   
   # Keep only the last 7 daily backups
   ls -t $BACKUP_DIR | tail -n +8 | xargs -I {} rm -rf "$BACKUP_DIR/{}"
   EOF
   
   chmod +x /usr/local/bin/backup-mongodb.sh
   
   # Add to crontab
   (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-mongodb.sh") | crontab -
   ```

2. Set up file backups for uploaded scans:
   ```bash
   # Create a backup script
   mkdir -p /backups/uploads
   
   cat > /usr/local/bin/backup-uploads.sh << 'EOF'
   #!/bin/bash
   TIMESTAMP=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="/backups/uploads"
   UPLOADS_DIR="/path/to/uploads"
   
   tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" "$UPLOADS_DIR"
   
   # Keep only the last 7 daily backups
   ls -t $BACKUP_DIR/uploads_*.tar.gz | tail -n +8 | xargs rm -f
   EOF
   
   chmod +x /usr/local/bin/backup-uploads.sh
   
   # Add to crontab
   (crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup-uploads.sh") | crontab -
   ```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**:
   - Check MongoDB service status: `sudo systemctl status mongodb`
   - Verify connection string in `.env` file
   - Check network connectivity: `telnet mongodb-host 27017`

2. **ML Service Not Responding**:
   - Check ML service logs: `docker logs imagemedix-ml`
   - Verify API key matches between backend and ML service
   - Check GPU availability: `nvidia-smi`

3. **File Upload Issues**:
   - Check disk space: `df -h`
   - Verify upload directory permissions: `ls -la /path/to/uploads`
   - Check file size limits in Nginx and application config

### Log Locations

- **Backend Logs**: `/var/log/imagemedix/backend.log`
- **Frontend Logs**: `/var/log/imagemedix/frontend.log`
- **ML Service Logs**: `/var/log/imagemedix/ml-service.log`
- **Nginx Logs**: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
- **MongoDB Logs**: `/var/log/mongodb/mongod.log`