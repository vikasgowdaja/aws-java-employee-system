Docker Networking Guide - Local vs AWS EC2

═══════════════════════════════════════════════════════════════════════════════
PART 1: HOW DOCKER NETWORKING WORKS LOCALLY
═══════════════════════════════════════════════════════════════════════════════

1. Docker Compose Bridge Network
   When you run: docker compose up -d
   
   What happens:
   - Docker creates a custom bridge network: employee-app-network
   - All services (frontend, backend, mysql) join this network
   - Services get internal hostnames: mysql, backend, frontend
   - Docker's internal DNS resolves these hostnames to container IPs
   
2. Internal Container Communication (Docker Network)
   Frontend container (nginx):        172.20.0.2
   Backend container (spring boot):   172.20.0.3
   MySQL container:                   172.20.0.4
   
   Inside containers, they use SERVICE NAMES:
   - Backend connects to: mysql:3306 (not localhost:3306)
   - Frontend proxies to: http://backend:8080/api/ (not localhost:8080)
   
3. External Access (From Your Machine)
   Your browser:  localhost:3000  →  Port mapping  →  Frontend container:3000
   Your browser:  localhost:8080  →  Port mapping  →  Backend container:8080
   
   Port mapping in compose:
   ports:
     - "${BACKEND_PORT}:8080"    (HOST_PORT:CONTAINER_PORT)

═══════════════════════════════════════════════════════════════════════════════
PART 2: TEST DOCKER NETWORKING LOCALLY
═══════════════════════════════════════════════════════════════════════════════

Commands to verify local setup:

1. List networks
   docker network ls
   
   Output should show:
   employee-app-network (bridge, driver name)

2. Inspect the network
   docker network inspect employee-app-network
   
   Shows all containers in this network with their IPs

3. Check if containers can resolve service names
   docker exec backend ping mysql
   
   Expected: mysql responses with IP (e.g., 172.20.0.4)
   If fails: MySQL not on same network

4. Test backend → MySQL connectivity
   docker exec backend mysql -h mysql -u root -pChangeThisStrongPassword -e "SELECT 1;"
   
   Expected: Returns 1 (MySQL is responding)
   If fails: Check DB credentials, MySQL not healthy

5. Test frontend → backend proxy
   docker exec frontend curl http://backend:8080/api/auth/login
   
   Expected: Returns 400 or response from backend
   If fails: Backend not responding, check logs

6. View container logs
   docker compose logs backend
   docker compose logs frontend
   docker compose logs mysql

═══════════════════════════════════════════════════════════════════════════════
PART 3: DIFFERENCES: LOCAL vs AWS EC2
═══════════════════════════════════════════════════════════════════════════════

LOCAL DEVELOPMENT:
┌────────────────────────────────────────────────────────────────────┐
│ Your Computer (Host)                                               │
│                                                                    │
│  Browser: localhost:3000 ──────┐                                   │
│  Browser: localhost:8080 ──────┤                                   │
│                                │                                   │
│  Docker Bridge Network (employee-app-network)                     │
│  ├─ frontend (172.20.0.2)      │ Port maps:                       │
│  │  Engine: Nginx              ├─ 3000:3000                       │
│  │  Uses: backend:8080         │                                  │
│  │                             │                                  │
│  ├─ backend (172.20.0.3)       ├─ 8080:8080                       │
│  │  Engine: Spring Boot        │                                  │
│  │  Uses: mysql:3306           │                                  │
│  │                             │                                  │
│  ├─ mysql (172.20.0.4)         └─ 3306:NONE (internal only)       │
│  │  Engine: MySQL              DB_HOST=mysql works!               │
│  │                                                                │
│  Volume: mysql_data           MySQL data stored locally           │
└────────────────────────────────────────────────────────────────────┘

AWS EC2 PRODUCTION:
┌─────────────────────────────────────────────────────────────────────────┐
│ EC2 Instance (Host)                                                     │
│ Public IP: 1.2.3.4                                                      │
│                                                                         │
│  Browser: 1.2.3.4:3000 ────────┐                                        │
│  Browser: 1.2.3.4:8080 ────────┤                                        │
│                               │                                        │
│  Docker Bridge Network (employee-app-network)                          │
│  ├─ frontend (172.17.0.2)     │ Port maps:                            │
│  │  Engine: Nginx            ├─ 3000:3000                            │
│  │  Uses: backend:8080       │                                       │
│  │                           │                                       │
│  ├─ backend (172.17.0.3)     ├─ 8080:8080                            │
│  │  Engine: Spring Boot      │                                       │
│  │  Uses: mysql:3306         │                                       │
│  │                           │                                       │
│  ├─ mysql (172.17.0.4)       └─ 3306:NONE (internal only)            │
│  │  Engine: MySQL             DB_HOST=mysql works same way!          │
│  │                                                                    │
│  Volume: mysql_data           MySQL data stored in EBS               │
│                                                                         │
│ Security Group Rules:                                                  │
│ ├─ Port 22 (SSH)    → Restricted to admin IP                          │
│ ├─ Port 80 (HTTP)   → 0.0.0.0/0                                       │
│ ├─ Port 443 (HTTPS) → 0.0.0.0/0                                       │
│ ├─ Port 3000        → 0.0.0.0/0                                       │
│ └─ Port 8080        → 0.0.0.0/0                                       │
│                                                                         │
│ MySQL NOT exposed: No inbound rule for port 3306                      │
└─────────────────────────────────────────────────────────────────────────┘

KEY DIFFERENCE:
Local:   localhost (127.0.0.1) - same machine
EC2:     Public IP - different machine on internet
         Inside containers: Same service-name networking works identically!

═══════════════════════════════════════════════════════════════════════════════
PART 4: WHY IMAGES WORK LOCALLY BUT NOT ON EC2 (COMMON ISSUES)
═══════════════════════════════════════════════════════════════════════════════

ISSUE 1: Hardcoded localhost in configuration
❌ Frontend config: REACT_APP_API_BASE_URL=http://localhost:8080/api
✅ Frontend config: REACT_APP_API_BASE_URL=http://backend:8080/api (inside docker)
✅ Frontend config: REACT_APP_API_BASE_URL=/api (proxied by nginx)

How to fix: Use environment variables, not hardcoded URLs

ISSUE 2: Backend cannot connect to MySQL
❌ Backend config: DB_HOST=localhost
✅ Backend config: DB_HOST=mysql (service name inside docker network)

Your current config (application.yaml):
  url: jdbc:mysql://${DB_HOST:mysql}:${DB_PORT:3306}/${DB_NAME:employeedb}...
  ✅ This is CORRECT! Uses mysql as default service name

ISSUE 3: Docker image pulls wrong registry
❌ Image: aws-java-employee-system-backend (local build, not on Docker Hub)
✅ Image: vikasgowdaja/java-aws-emp-crud:backend (pushed to Docker Hub)

docker-compose.yml must reference correct image.

ISSUE 4: Environment variables not set
❌ docker compose up -d  (without .env file)
✅ docker compose up -d  (reads .env automatically)

Ensure .env file is in same directory as docker-compose.yml

ISSUE 5: Security Group blocking traffic
❌ EC2 Security Group doesn't have inbound rules for ports 3000, 8080
✅ Add inbound rules: Port 3000 (0.0.0.0/0), Port 8080 (0.0.0.0/0)

═══════════════════════════════════════════════════════════════════════════════
PART 5: NETWORKING DEBUGGING CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

When images work locally but fail on EC2, test in this order:

STEP 1: Containers running?
   docker compose ps
   All services should show: Up

STEP 2: On same network?
   docker network inspect employee-app-network
   All 3 services should be listed with IPs

STEP 3: DNS resolution working?
   docker exec backend ping mysql
   docker exec backend ping frontend
   Should respond with IP

STEP 4: Ports accessible from host?
   curl localhost:3000  (local)
   curl localhost:8080  (local)
   curl http://EC2_IP:3000  (EC2)
   curl http://EC2_IP:8080  (EC2)

STEP 5: Environment variables set correctly?
   docker exec backend env | grep DB_
   
   Expected output:
   DB_HOST=mysql
   DB_PORT=3306
   DB_NAME=employeedb
   DB_USER=root
   DB_PASSWORD=YourPassword

STEP 6: Check application logs
   docker compose logs backend
   
   Look for:
   - "Connection refused" → MySQL not responding
   - "Connection pool exhausted" → Too many connections
   - "Hibernate" errors → Database schema issues
   - Port already in use → Port conflict

STEP 7: Test database directly
   docker exec mysql mysql -h localhost -u root -pPassword -e "SHOW DATABASES;"
   
   Expected: Shows databases including employeedb

STEP 8: Test backend API directly
   curl -X POST http://localhost:8080/api/auth/register \
   -H "Content-Type: application/json" \
   -d '{"username":"test","email":"test@test.com","password":"pass","displayName":"Test"}'
   
   Expected: 201 Created or error response (not connection refused)

═══════════════════════════════════════════════════════════════════════════════
PART 6: VERIFYING IMAGES ARE CORRECT
═══════════════════════════════════════════════════════════════════════════════

Check which images are being used:

1. View docker-compose.yml image references
   grep "image:" docker-compose.yml
   
   Expected output:
   image: vikasgowdaja/java-aws-emp-crud:backend
   image: vikasgowdaja/java-aws-emp-crud:frontend
   image: mysql:8.4

2. Verify images exist locally
   docker images | grep java-aws-emp-crud
   
   Expected: Shows backend and frontend images with your registry

3. List running image details
   docker compose ps --format "table {{.Service}}\t{{.Image}}\t{{.Status}}"
   
   Expected:
   frontend   vikasgowdaja/java-aws-emp-crud:frontend   Up
   backend    vikasgowdaja/java-aws-emp-crud:backend     Up
   mysql      mysql:8.4                                   Up

4. Force pull latest images from registry
   docker compose pull
   docker compose up -d

═══════════════════════════════════════════════════════════════════════════════
PART 7: DNS RESOLUTION INSIDE CONTAINERS
═══════════════════════════════════════════════════════════════════════════════

How containers find each other:

1. Embedded DNS server
   Docker provides internal DNS on 127.0.0.11:53
   When container tries to connect to "mysql", DNS resolves to container IP

2. Service name → IP resolution
   mysql:3306  →  (DNS lookup)  →  172.20.0.4:3306
   backend     →  (DNS lookup)  →  172.20.0.3
   frontend    →  (DNS lookup)  →  172.20.0.2

3. Test DNS from inside container
   docker exec mysql cat /etc/resolv.conf
   
   Expected: Shows nameserver 127.0.0.11

4. Verify service name resolves
   docker exec backend nslookup mysql
   
   Expected: Shows IP address of mysql container
   If fails: Containers not on same network

═══════════════════════════════════════════════════════════════════════════════
PART 8: UNDERSTANDING YOUR CURRENT CONFIG
═══════════════════════════════════════════════════════════════════════════════

Your application.yaml:

Spring datasource URL:
  jdbc:mysql://${DB_HOST:mysql}:${DB_PORT:3306}/${DB_NAME:employeedb}...

This means:
1. DB_HOST environment variable → "mysql" (service name)
2. If DB_HOST not set, defaults to "mysql"
3. Inside Docker, "mysql" resolves to MySQL container IP
4. Port 3306 is standard MySQL port
5. Database name: employeedb (auto-created by MySQL)

Your .env file:
  DB_HOST=mysql        ✅ Correct (service name, not localhost)
  DB_PORT=3306         ✅ Standard MySQL port
  REACT_APP_API_BASE_URL=/api  ✅ Frontend proxies to backend via Nginx

This config works IDENTICALLY on:
- Local Windows Docker Desktop
- AWS EC2 Ubuntu with Docker
- Any machine with Docker installed

The ONLY difference is:
- Local: You access via localhost:3000
- EC2: You access via your-public-ip:3000
- Inside containers: ALWAYS use service names (mysql, backend)

═══════════════════════════════════════════════════════════════════════════════
PART 9: STEP-BY-STEP VERIFICATION AFTER DEPLOYING TO EC2
═══════════════════════════════════════════════════════════════════════════════

SSH to EC2 and run these commands:

1. Verify services are running
   docker compose ps

2. Check MySQL is healthy
   docker exec mysql mysql -uroot -pYourPassword -e "SELECT 1;"

3. Check backend can reach MySQL
   docker exec backend mysql -h mysql -uroot -pYourPassword -e "SELECT 1;"

4. Test backend API
   docker exec backend curl -s http://localhost:8080/api/auth/login | head -20

5. View backend logs for errors
   docker compose logs --tail 50 backend

6. View frontend logs
   docker compose logs --tail 50 frontend

7. Test from your local computer
   curl http://your-ec2-ip:8080/api/auth/login

8. If frontend not working, check nginx proxy
   docker exec frontend curl http://backend:8080/api/auth/login

═══════════════════════════════════════════════════════════════════════════════
PART 10: QUICK REFERENCE - WHEN TO USE WHAT
═══════════════════════════════════════════════════════════════════════════════

Inside Container (when building image):
  Backend needs DB → Use: mysql:3306 (service name)
  Frontend needs API → Use: /api (Nginx proxies it)
  
Local Testing (from your computer):
  Frontend → http://localhost:3000
  Backend → http://localhost:8080
  
EC2 Testing (from your computer):
  Frontend → http://EC2_PUBLIC_IP:3000
  Backend → http://EC2_PUBLIC_IP:8080
  
Container-to-Container:
  ALWAYS use service names: mysql, backend, frontend
  NEVER use localhost or 127.0.0.1

Environment Variables:
  DB_HOST=mysql  (NOT localhost)
  REACT_APP_API_BASE_URL=/api  (proxied by nginx, NOT http://localhost:8080)

═══════════════════════════════════════════════════════════════════════════════
