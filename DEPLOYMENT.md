Docker Deployment Guide (AWS EC2 Ubuntu)

1. Install Docker and Docker Compose plugin
- sudo apt-get update
- sudo apt-get install -y ca-certificates curl gnupg
- sudo install -m 0755 -d /etc/apt/keyrings
- curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
- sudo chmod a+r /etc/apt/keyrings/docker.gpg
- echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
- sudo apt-get update
- sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
- sudo usermod -aG docker $USER
- newgrp docker

2. Pull your project
- git clone <your-repo-url>
- cd aws-java-employee-system

3. Configure environment
- Edit .env and set DB_PASSWORD to a strong value.
- Optional: adjust FRONTEND_PORT and BACKEND_PORT if needed.

4. Start full stack
- docker compose up -d --build

5. Verify running services
- docker compose ps
- docker compose logs -f backend
- docker compose logs -f frontend

6. Access application
- Frontend: http://EC2_PUBLIC_IP:3000
- Backend API: http://EC2_PUBLIC_IP:8080

7. Stop services
- docker compose down

8. Data persistence
- MySQL data is stored in Docker volume mysql_data and survives container restarts.

Notes
- MySQL is not exposed to host ports and is reachable only inside the Docker network.
- Frontend proxies /api calls to backend service name backend over internal Docker network.
