pipeline {
    agent any

    environment {
        NODE_VERSION = '20'
        BACKEND_DIR = 'backend'
        FRONTEND_DIR = 'frontend'
        REPO_URL = 'https://github.com/AbhiramaBM/Radio_ninada.git'
    }

    stages {

        stage('Clone Repository') {
            steps {
                echo 'Cloning Radio Ninada repository...'

                git branch: 'main',
                    url: "${REPO_URL}"
            }
        }

        stage('Environment Check') {
            steps {
                bat '''
                    echo "======================================"
                    echo "RADIO NINADA CI/CD"
                    echo "======================================"

                    echo "Node version:"
                    node --version

                    echo "NPM version:"
                    npm --version

                    echo "Current directory:"
                    pwd

                    echo "Repository files:"
                    ls -la
                '''
            }
        }

        stage('Backend - Install Dependencies') {
            steps {
                dir("${BACKEND_DIR}") {
                    bat '''
                        echo "Installing backend dependencies..."
                        npm ci
                    '''
                }
            }
        }

        stage('Backend - Prisma Generate') {
            steps {
                dir("${BACKEND_DIR}") {
                    bat '''
                        echo "Generating Prisma Client..."
                        npx prisma generate
                    '''
                }
            }
        }

        stage('Backend - TypeScript Check') {
            steps {
                dir("${BACKEND_DIR}") {
                    bat '''
                        echo "Running TypeScript check..."
                        npx tsc --noEmit
                    '''
                }
            }
        }

        stage('Backend - Test') {
            steps {
                dir("${BACKEND_DIR}") {
                    bat '''
                        echo "Running backend tests..."

                        if npm run | grep -q "test"; then
                            npm test
                        else
                            echo "No test script found. Skipping tests."
                        fi
                    '''
                }
            }
        }

        stage('Backend - Build') {
            steps {
                dir("${BACKEND_DIR}") {
                    bat '''
                        echo "Building backend..."

                        if npm run | grep -q "build"; then
                            npm run build
                        else
                            echo "No build script found."
                        fi
                    '''
                }
            }
        }

        stage('Frontend - Install Dependencies') {
            steps {
                dir("${FRONTEND_DIR}") {
                    bat '''
                        echo "Installing frontend dependencies..."
                        npm ci
                    '''
                }
            }
        }

        stage('Frontend - Validate') {
            steps {
                dir("${FRONTEND_DIR}") {
                    bat '''
                        echo "Validating frontend..."

                        if npm run | grep -q "lint"; then
                            npm run lint
                        else
                            echo "No lint script found. Skipping lint."
                        fi
                    '''
                }
            }
        }

        stage('Frontend - Build') {
            steps {
                dir("${FRONTEND_DIR}") {
                    bat '''
                        echo "Checking frontend build..."

                        if npm run | grep -q "build"; then
                            npm run build
                        else
                            echo "Static frontend detected."
                            echo "No frontend build required."
                        fi
                    '''
                }
            }
        }

        stage('Database Migration') {
            steps {
                dir("${BACKEND_DIR}") {
                    bat '''
                        echo "Checking database configuration..."

                        if [ -n "$DATABASE_URL" ]; then
                            echo "Running Prisma migrations..."
                            npx prisma migrate deploy
                        else
                            echo "DATABASE_URL not configured."
                            echo "Skipping database migration."
                        fi
                    '''
                }
            }
        }

        stage('Deploy Backend') {
            steps {
                echo 'Deploying Radio Ninada Backend...'

                bat '''
                    # Uncomment when PM2 is configured:

                    # cd backend
                    # pm2 restart radio-ninada-backend || \
                    # pm2 start dist/server.js --name radio-ninada-backend
                    # pm2 save

                    echo "Backend deployment stage completed."
                '''
            }
        }

        stage('Deploy Frontend') {
            steps {
                echo 'Deploying Radio Ninada Frontend...'

                bat '''
                    # Add your frontend deployment command here.

                    echo "Frontend deployment stage completed."
                '''
            }
        }
    }

    post {

        success {
            echo '''
==========================================
 RADIO NINADA PIPELINE SUCCESSFUL
==========================================
 Repository : Radio_ninada
 Backend    : SUCCESS
 Frontend   : SUCCESS
 Prisma     : SUCCESS
==========================================
            '''
        }

        failure {
            echo '''
==========================================
 RADIO NINADA PIPELINE FAILED
==========================================
 Check Jenkins Console Output
==========================================
            '''
        }

        always {
            echo 'Cleaning Jenkins workspace...'

            cleanWs(
                deleteDirs: true,
                disableDeferredWipeout: true
            )
        }
    }
}