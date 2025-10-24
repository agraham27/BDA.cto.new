# CI/CD Configuration Examples

This document provides example configurations for various CI/CD platforms to automate the deployment of Hoc Vien Big Dipper.

## GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies (Backend)
        working-directory: ./backend
        run: npm ci
      
      - name: Run tests (Backend)
        working-directory: ./backend
        run: npm test
        continue-on-error: true
      
      - name: Build backend
        working-directory: ./backend
        run: npm run build
      
      - name: Install dependencies (Frontend)
        working-directory: ./frontend
        run: npm ci
      
      - name: Build frontend
        working-directory: ./frontend
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
          NEXT_PUBLIC_SITE_URL: ${{ secrets.NEXT_PUBLIC_SITE_URL }}
      
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT || 22 }}
          script: |
            cd /var/www/hocvienbigdipper/repo
            git pull origin main
            ./scripts/deploy.sh
      
      - name: Health Check
        run: |
          sleep 10
          curl -f https://hocvienbigdipper.com/health || exit 1
          curl -f https://api.hocvienbigdipper.com/health || exit 1
      
      - name: Notify on success
        if: success()
        run: echo "Deployment successful!"
      
      - name: Notify on failure
        if: failure()
        run: echo "Deployment failed!"
```

### Required GitHub Secrets:
- `VPS_HOST`: Your VPS IP or hostname
- `VPS_USER`: SSH username (e.g., `deploy`)
- `VPS_SSH_KEY`: Private SSH key for authentication
- `VPS_PORT`: SSH port (default: 22)
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_SITE_URL`: Frontend site URL

---

## GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"

test:backend:
  stage: test
  image: node:${NODE_VERSION}
  before_script:
    - cd backend
    - npm ci
  script:
    - npm test
  cache:
    paths:
      - backend/node_modules/

test:frontend:
  stage: test
  image: node:${NODE_VERSION}
  before_script:
    - cd frontend
    - npm ci
  script:
    - npm test || true
  cache:
    paths:
      - frontend/node_modules/

build:backend:
  stage: build
  image: node:${NODE_VERSION}
  before_script:
    - cd backend
    - npm ci
  script:
    - npm run build
  artifacts:
    paths:
      - backend/dist/
    expire_in: 1 hour
  cache:
    paths:
      - backend/node_modules/

build:frontend:
  stage: build
  image: node:${NODE_VERSION}
  before_script:
    - cd frontend
    - npm ci
  script:
    - npm run build
  artifacts:
    paths:
      - frontend/.next/
    expire_in: 1 hour
  cache:
    paths:
      - frontend/node_modules/

deploy:production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client bash
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan $VPS_HOST >> ~/.ssh/known_hosts
    - chmod 644 ~/.ssh/known_hosts
  script:
    - ssh $VPS_USER@$VPS_HOST "cd /var/www/hocvienbigdipper/repo && git pull origin main && ./scripts/deploy.sh"
  only:
    - main
  when: manual
```

### Required GitLab CI/CD Variables:
- `VPS_HOST`: Your VPS IP or hostname
- `VPS_USER`: SSH username
- `SSH_PRIVATE_KEY`: Private SSH key

---

## Jenkins Pipeline

Create `Jenkinsfile`:

```groovy
pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        VPS_HOST = credentials('vps-host')
        VPS_USER = credentials('vps-user')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }
        
        stage('Test') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh 'npm test || true'
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh 'npm test || true'
                        }
                    }
                }
            }
        }
        
        stage('Build') {
            parallel {
                stage('Backend Build') {
                    steps {
                        dir('backend') {
                            sh 'npm run build'
                        }
                    }
                }
                stage('Frontend Build') {
                    steps {
                        dir('frontend') {
                            sh 'npm run build'
                        }
                    }
                }
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sshagent(credentials: ['vps-ssh-key']) {
                    sh '''
                        ssh ${VPS_USER}@${VPS_HOST} "cd /var/www/hocvienbigdipper/repo && git pull origin main && ./scripts/deploy.sh"
                    '''
                }
            }
        }
        
        stage('Health Check') {
            steps {
                sh '''
                    sleep 10
                    curl -f https://hocvienbigdipper.com/health
                    curl -f https://api.hocvienbigdipper.com/health
                '''
            }
        }
    }
    
    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}
```

---

## CircleCI

Create `.circleci/config.yml`:

```yaml
version: 2.1

orbs:
  node: circleci/node@5.1

jobs:
  test-backend:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
          app-dir: backend
      - run:
          name: Run backend tests
          command: cd backend && npm test

  test-frontend:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
          app-dir: frontend
      - run:
          name: Run frontend tests
          command: cd frontend && npm test || true

  build-backend:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
          app-dir: backend
      - run:
          name: Build backend
          command: cd backend && npm run build
      - persist_to_workspace:
          root: .
          paths:
            - backend/dist

  build-frontend:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
          app-dir: frontend
      - run:
          name: Build frontend
          command: cd frontend && npm run build
      - persist_to_workspace:
          root: .
          paths:
            - frontend/.next

  deploy:
    docker:
      - image: cimg/base:stable
    steps:
      - checkout
      - attach_workspace:
          at: .
      - add_ssh_keys:
          fingerprints:
            - $SSH_KEY_FINGERPRINT
      - run:
          name: Deploy to VPS
          command: |
            ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd /var/www/hocvienbigdipper/repo && git pull origin main && ./scripts/deploy.sh"
      - run:
          name: Health check
          command: |
            sleep 10
            curl -f https://hocvienbigdipper.com/health
            curl -f https://api.hocvienbigdipper.com/health

workflows:
  version: 2
  test-build-deploy:
    jobs:
      - test-backend
      - test-frontend
      - build-backend:
          requires:
            - test-backend
      - build-frontend:
          requires:
            - test-frontend
      - deploy:
          requires:
            - build-backend
            - build-frontend
          filters:
            branches:
              only: main
```

---

## Best Practices

### 1. Environment Variables
- Never commit secrets to version control
- Use CI/CD platform's secret management
- Rotate secrets regularly

### 2. Deployment Strategy
- Always run tests before deployment
- Use health checks to verify deployment
- Implement rollback mechanisms
- Deploy during low-traffic periods

### 3. Security
- Use SSH key authentication
- Limit SSH access to CI/CD IP ranges
- Enable audit logging
- Review deployment logs regularly

### 4. Monitoring
- Set up alerts for failed deployments
- Monitor application health after deployment
- Track deployment metrics (duration, frequency)
- Implement automatic rollback on health check failure

### 5. Database Migrations
- Run migrations before code deployment
- Test migrations in staging first
- Keep backup before migrations
- Implement migration rollback procedures

---

## Rollback Procedure

If deployment fails, rollback using Git:

```bash
ssh deploy@your-vps
cd /var/www/hocvienbigdipper/repo
git log --oneline -5  # Find previous commit
git reset --hard <previous-commit-hash>
./scripts/deploy.sh
```

Or use PM2 to restart previous version:

```bash
pm2 reload ecosystem.config.js
```

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [CircleCI Documentation](https://circleci.com/docs/)
