```groovy
pipeline {
    agent any

    environment {
        NODE_VERSION = '20'
        BACKEND_DIR = 'backend'
        FRONTEND_DIR = 'frontend'
        REPO_URL = 'https://github.com/AbhiramaBM/Radio_ninada.git'
    }

    stages {

        // ==========================================
        // CLONE
        // ==========================================

        stage('Clone Repository') {
            steps {
                echo 'Cloning Radio Ninada repository...'

                git branch: 'main',
                    url: "${REPO_URL}"
            }
        }

        // ==========================================
        // ENVIRONMENT CHECK
        // ==========================================

        stage('Environment Check') {
            steps {
                bat '''
                    echo ======================================
                    echo RADIO NINADA CI/CD
                    echo ======================================

                    echo Node version:
                    node --version

                    echo NPM version:
                    npm --version

                    echo Current directory:
                    cd

                    echo Repository files:
                    dir
                '''
            }
        }

        // ==========================================
        // BACKEND
        // ==========================================

        stage('Backend - Install Dependencies') {
            steps {
                dir("${BACKEND_DIR}") {
                    bat '''
                        echo Installing backend dependencies...
                        call npm ci

                        if errorlevel 1 (
                            echo Backend dependency installation failed.
                            exit /b 1
                        )
                    '''
                }
            }
        }

        stage('Backend - Prisma Generate') {
            steps {
                dir("${BACKEND_DIR}") {
                    bat '''
                        echo Generating Prisma Client...
                        call npx prisma generate

                        if errorlevel 1 (
                            echo Prisma Client generation failed.
                            exit /b 1
                        )
                    '''
                }
            }
        }

        stage('Backend - TypeScript Check') {
            steps {
                dir("${BACKEND_DIR}") {
                    bat '''
                        echo Running TypeScript check...
                        call npx tsc --noEmit

                        if errorlevel 1 (
                            echo TypeScript check failed.
                            exit /b 1
                        )
                    '''
                }
            }
        }

        stage('Backend - Test') {
            steps {
                dir("${BACKEND_DIR}") {
                    script {
                        def hasTestScript = bat(
                            script: 'node -e "const p=require(\\'./package.json\\'); process.exit(p.scripts && p.scripts.test ? 0 : 1)"',
                            returnStatus: true
                        )

                        if (hasTestScript == 0) {
                            echo 'Test script found. Running backend tests...'

                            bat '''
                                call npm test

                                if errorlevel 1 (
                                    echo Backend tests failed.
                                    exit /b 1
                                )
                            '''
                        } else {
                            echo 'No test script found. Skipping backend tests.'
                        }
                    }
                }
            }
        }

        stage('Backend - Build') {
            steps {
                dir("${BACKEND_DIR}") {
                    script {
                        def hasBuildScript = bat(
                            script: 'node -e "const p=require(\\'./package.json\\'); process.exit(p.scripts && p.scripts.build ? 0 : 1)"',
                            returnStatus: true
                        )

                        if (hasBuildScript == 0) {
                            echo 'Build script found. Building backend...'

                            bat '''
                                call npm run build

                                if errorlevel 1 (
                                    echo Backend build failed.
                                    exit /b 1
                                )
                            '''
                        } else {
                            echo 'No build script found. Skipping backend build.'
                        }
                    }
                }
            }
        }

        // ==========================================
        // FRONTEND
        // ==========================================

        stage('Frontend - Install Dependencies') {
            steps {
                dir("${FRONTEND_DIR}") {
                    bat '''
                        echo Installing frontend dependencies...
                        call npm ci

                        if errorlevel 1 (
                            echo Frontend dependency installation failed.
                            exit /b 1
                        )
                    '''
                }
            }
        }

        stage('Frontend - Validate') {
            steps {
                dir("${FRONTEND_DIR}") {
                    script {
                        def hasLintScript = bat(
                            script: 'node -e "const p=require(\\'./package.json\\'); process.exit(p.scripts && p.scripts.lint ? 0 : 1)"',
                            returnStatus: true
                        )

                        if (hasLintScript == 0) {
                            echo 'Lint script found. Running frontend lint...'

                            bat '''
                                call npm run lint

                                if errorlevel 1 (
                                    echo Frontend lint failed.
                                    exit /b 1
                                )
                            '''
                        } else {
                            echo 'No lint script found. Skipping lint.'
                        }
                    }
                }
            }
        }

        stage('Frontend - Build') {
            steps {
                dir("${FRONTEND_DIR}") {
                    script {
                        def hasBuildScript = bat(
                            script: 'node -e "const p=require(\\'./package.json\\'); process.exit(p.scripts && p.scripts.build ? 0 : 1)"',
                            returnStatus: true
                        )

                        if (hasBuildScript == 0) {
                            echo 'Build script found. Building frontend...'

                            bat '''
                                call npm run build

                                if errorlevel 1 (
                                    echo Frontend build failed.
                                    exit /b 1
                                )
                            '''
                        } else {
                            echo 'No frontend build script found.'
                            echo 'Skipping frontend build.'
                        }
                    }
                }
            }
        }

        // ==========================================
        // DATABASE
        // ==========================================

        stage('Database Migration') {
            steps {
                dir("${BACKEND_DIR}") {
                    script {
                        if (env.DATABASE_URL?.trim()) {

                            echo 'DATABASE_URL detected.'
                            echo 'Running Prisma migrations...'

                            bat '''
                                call npx prisma migrate deploy

                                if errorlevel 1 (
                                    echo Prisma database migration failed.
                                    exit /b 1
                                )
                            '''

                        } else {
                            echo 'DATABASE_URL not configured.'
                            echo 'Skipping database migration.'
                        }
                    }
                }
            }
        }

        // ==========================================
        // DEPLOY BACKEND
        // ==========================================

        stage('Deploy Backend') {
            steps {
                echo 'Deploying Radio Ninada Backend...'

                bat '''
                    echo Backend deployment started.

                    REM If PM2 is installed and configured, use:
                    REM cd backend
                    REM pm2 restart radio-ninada-backend
                    REM if errorlevel 1 pm2 start dist/server.js --name radio-ninada-backend
                    REM pm2 save

                    echo Backend deployment stage completed.
                '''
            }
        }

        // ==========================================
        // DEPLOY FRONTEND
        // ==========================================

        stage('Deploy Frontend') {
            steps {
                echo 'Deploying Radio Ninada Frontend...'

                bat '''
                    echo Frontend deployment started.

                    REM Add your Windows-compatible frontend
                    REM deployment command here.

                    echo Frontend deployment stage completed.
                '''
            }
        }
    }

    // ==========================================
    // POST ACTIONS
    // ==========================================

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
```
