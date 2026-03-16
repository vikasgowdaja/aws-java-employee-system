AWS EC2 Deployment Guide - Complete Setup

═══════════════════════════════════════════════════════════════════════════════
PART 1: VPC & SECURITY GROUP SETUP
═══════════════════════════════════════════════════════════════════════════════

1. Create VPC (if not using default)
   - AWS Console → VPC → Create VPC
   - CIDR Block: 10.0.0.0/16
   - Enable DNS hostnames: Yes

2. Create Security Group for EC2 instance
   - AWS Console → EC2 → Security Groups → Create Security Group
   - Name: employee-app-sg
   - VPC: Select your VPC
   
3. Configure Inbound Rules
   - Add Rule 1 (HTTP):
     * Type: HTTP
     * Protocol: TCP
     * Port Range: 80
     * Source: 0.0.0.0/0 (or your IP only for security)
   
   - Add Rule 2 (HTTPS):
     * Type: HTTPS
     * Protocol: TCP
     * Port Range: 443
     * Source: 0.0.0.0/0 (or your IP only for security)
   
   - Add Rule 3 (Frontend - Nginx):
     * Type: Custom TCP
     * Protocol: TCP
     * Port Range: 3000
     * Source: 0.0.0.0/0
   
   - Add Rule 4 (Backend API):
     * Type: Custom TCP
     * Protocol: TCP
     * Port Range: 8080
     * Source: 0.0.0.0/0
   
   - Add Rule 5 (SSH - for admin access):
     * Type: SSH
     * Protocol: TCP
     * Port Range: 22
     * Source: YOUR_IP/32 (for security)

4. Outbound Rules
   - Keep default: Allow all traffic to 0.0.0.0/0

═══════════════════════════════════════════════════════════════════════════════
PART 2: LAUNCH EC2 INSTANCE
═══════════════════════════════════════════════════════════════════════════════

1. Launch EC2 Instance
   - AWS Console → EC2 → Instances → Launch Instance
   - Instance Type: t3.small (or t3.medium for faster builds)
   - AMI: Ubuntu 22.04 LTS (ami-xxxxx)
   - VPC: Select your VPC
   - Security Group: employee-app-sg

2. Create/Select Key Pair
   - Download .pem file and store securely
   - chmod 400 your-key.pem (on local machine)

3. Elastic IP (Optional but recommended)
   - AWS Console → EC2 → Elastic IPs → Allocate
   - Associate with your instance
   - Use this IP for all connections

═══════════════════════════════════════════════════════════════════════════════
PART 3: CONNECT & INSTALL DOCKER
═══════════════════════════════════════════════════════════════════════════════

1. SSH into instance
   ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP

2. Update system
   sudo apt-get update
   sudo apt-get upgrade -y

3. Install Docker & Docker Compose
   sudo apt-get install -y ca-certificates curl gnupg lsb-release
   
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   
   sudo apt-get update
   sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
   
   sudo usermod -aG docker ubuntu
   newgrp docker

4. Verify Docker installation
   docker --version
   docker compose version

═══════════════════════════════════════════════════════════════════════════════
PART 4: PULL PROJECT & START SERVICES
═══════════════════════════════════════════════════════════════════════════════

1. Clone your repository
   git clone https://github.com/YOUR_USERNAME/aws-java-employee-system.git
   cd aws-java-employee-system

2. Configure environment variables
   vim .env
   
   Update these values:
   - FRONTEND_PORT=3000
   - BACKEND_PORT=8080
   - DB_HOST=mysql
   - DB_PORT=3306
   - DB_NAME=employeedb
   - DB_USER=root
   - DB_PASSWORD=YourStrongPassword123!  (CHANGE THIS!)
   - REACT_APP_API_BASE_URL=/api

3. Start all services
   docker compose up -d

4. Verify services are running
   docker compose ps
   
   Expected output:
   NAME        STATUS              PORTS
   frontend    Up (healthy)        0.0.0.0:3000->3000/tcp
   backend     Up                  0.0.0.0:8080->8080/tcp
   mysql       Up (healthy)        3306/tcp

5. Check logs for any errors
   docker compose logs -f backend
   docker compose logs -f frontend
   docker compose logs -f mysql

═══════════════════════════════════════════════════════════════════════════════
PART 5: ACCESS APPLICATION
═══════════════════════════════════════════════════════════════════════════════

After services are running (wait 30-60 seconds for backend to initialize):

Frontend (React App):
   http://YOUR_EC2_PUBLIC_IP:3000

Backend API (Health check):
   http://YOUR_EC2_PUBLIC_IP:8080/api/auth/login

Test register endpoint (POST):
   curl -X POST http://YOUR_EC2_PUBLIC_IP:8080/api/auth/register \
   -H "Content-Type: application/json" \
   -d '{
     "username": "testuser",
     "displayName": "Test User",
     "email": "test@example.com",
     "password": "TestPass123!"
   }'

═══════════════════════════════════════════════════════════════════════════════
PART 6: NGINX REVERSE PROXY (PRODUCTION - OPTIONAL)
═══════════════════════════════════════════════════════════════════════════════

If you want to serve both frontend and backend on port 80 (HTTP):

1. Install Nginx on EC2
   sudo apt-get install -y nginx

2. Create Nginx config
   sudo vim /etc/nginx/sites-available/employee-app
   
   Paste this:
   
   upstream backend {
       server localhost:8080;
   }

   upstream frontend {
       server localhost:3000;
   }

   server {
       listen 80;
       server_name _;

       # Frontend
       location / {
           proxy_pass http://frontend;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Backend API
       location /api/ {
           proxy_pass http://backend/api/;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }

3. Enable the config
   sudo ln -s /etc/nginx/sites-available/employee-app /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx

4. Now access via standard HTTP port
   http://YOUR_EC2_PUBLIC_IP/        (Frontend)
   http://YOUR_EC2_PUBLIC_IP/api/... (Backend)

═══════════════════════════════════════════════════════════════════════════════
PART 7: SSL/TLS CERTIFICATE (HTTPS - PRODUCTION)
═══════════════════════════════════════════════════════════════════════════════

Using Let's Encrypt with Certbot:

1. Install Certbot
   sudo apt-get install -y certbot python3-certbot-nginx

2. Obtain certificate (replace example.com with your domain)
   sudo certbot --nginx -d example.com -d www.example.com

3. Auto-renewal (runs twice daily)
   sudo systemctl enable certbot.timer
   sudo systemctl start certbot.timer

Access via HTTPS:
   https://your-domain.com/        (Frontend)
   https://your-domain.com/api/... (Backend)

═══════════════════════════════════════════════════════════════════════════════
PART 8: MONITORING & TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

View container logs:
   docker compose logs -f          (all)
   docker compose logs -f backend
   docker compose logs -f frontend
   docker compose logs -f mysql

Check database connection:
   docker exec -it mysql mysql -uroot -p$DB_PASSWORD -e "SHOW DATABASES;"

Stop all services:
   docker compose down

Restart services:
   docker compose restart

Update to latest images:
   docker compose pull
   docker compose up -d

Free up space (remove unused images):
   docker system prune -a

═══════════════════════════════════════════════════════════════════════════════
PART 9: SECURITY BEST PRACTICES
═══════════════════════════════════════════════════════════════════════════════

1. Change default DB password in .env IMMEDIATELY
2. Restrict Security Group SSH to your IP only
3. Enable EC2 instance termination protection
4. Create AMI backup after successful setup
5. Use Elastic IP for consistent access
6. Monitor EC2 CloudWatch metrics
7. Set up CloudWatch alarms for disk space
8. Regular backups of MySQL volume:
   docker exec mysql mysqldump -uroot -p$DB_PASSWORD --all-databases > backup.sql

═══════════════════════════════════════════════════════════════════════════════
PART 10: PORT SUMMARY
═══════════════════════════════════════════════════════════════════════════════

Port 22   → SSH (admin access)
Port 80   → HTTP (Nginx reverse proxy - optional)
Port 443  → HTTPS (SSL/TLS - optional)
Port 3000 → Frontend (Nginx inside container)
Port 8080 → Backend (Spring Boot API)
Port 3306 → MySQL (internal only, NOT exposed)

From external (Internet):
   22, 80, 443, 3000, 8080 are accessible

From within Docker network (internal only):
   mysql:3306 (backend can connect using hostname "mysql")

═══════════════════════════════════════════════════════════════════════════════
