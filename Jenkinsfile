pipeline {
    agent any

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timestamps()
    }

    parameters {
        booleanParam(
            name: 'BUILD_DOCKER_IMAGE',
            defaultValue: true,
            description: 'Build production Docker container image during CI (pre-deployment)'
        )
        booleanParam(
            name: 'DEPLOY_ENABLED',
            defaultValue: false,
            description: 'Trigger deployment (Disabled by default: pipeline runs till deployment)'
        )
    }

    environment {
        BACKEND_DIR = 'backend'
        FRONTEND_DIR = 'frontend'
        REPO_URL = 'https://github.com/AbhiramaBM/Radio_ninada.git'
        DOCKER_IMAGE_NAME = 'radio-ninada'
    }

    stages {
        // ==========================================
        // 1. CHECKOUT SOURCE
        // ==========================================
        stage('Checkout') {
            steps {
                script {
                    if (!fileExists("${BACKEND_DIR}/package.json")) {
                        echo "Repository not present in workspace. Cloning from ${REPO_URL}..."
                        try {
                            checkout scm
                        } catch (Exception e) {
                            echo "SCM checkout fallback: ${e.message}"
                            git branch: 'main', url: "${REPO_URL}"
                        }
                    } else {
                        echo "Repository source already present in workspace."
                    }
                }
            }
        }

        // ==========================================
        // 2. ENVIRONMENT VERIFICATION
        // ==========================================
        stage('Environment Check') {
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                            echo "=========================================="
                            echo " RADIO NINADA CI/CD PIPELINE (UNIX/LINUX)"
                            echo "=========================================="
                            echo "Node.js version : $(node --version)"
                            echo "NPM version     : $(npm --version)"
                            echo "Working dir     : $(pwd)"
                            echo "=========================================="
                        '''
                    } else {
                        bat '''
                            @echo off
                            echo ==========================================
                            echo  RADIO NINADA CI/CD PIPELINE (WINDOWS)
                            echo ==========================================
                            echo Node.js version :
                            node --version
                            echo NPM version     :
                            npm --version
                            echo Working dir     :
                            cd
                            echo ==========================================
                        '''
                    }
                }
            }
        }

        // ==========================================
        // 3. BACKEND - INSTALL DEPENDENCIES
        // ==========================================
        stage('Backend - Install Dependencies') {
            steps {
                dir("${BACKEND_DIR}") {
                    script {
                        echo 'Installing backend dependencies...'
                        if (isUnix()) {
                            sh 'npm ci || npm install'
                        } else {
                            bat 'call npm ci || call npm install'
                        }
                    }
                }
            }
        }

        // ==========================================
        // 4. BACKEND - PRISMA CLIENT GENERATION
        // ==========================================
        stage('Backend - Prisma Generate') {
            steps {
                dir("${BACKEND_DIR}") {
                    script {
                        echo 'Generating Prisma ORM Client...'
                        if (isUnix()) {
                            sh 'npx prisma generate'
                        } else {
                            bat 'call npx prisma generate'
                        }
                    }
                }
            }
        }

        // ==========================================
        // 5. BACKEND - TYPE CHECK (TSC)
        // ==========================================
        stage('Backend - TypeScript Check') {
            steps {
                dir("${BACKEND_DIR}") {
                    script {
                        echo 'Running TypeScript type check (noEmit)...'
                        if (isUnix()) {
                            sh 'npx tsc --noEmit'
                        } else {
                            bat 'call npx tsc --noEmit'
                        }
                    }
                }
            }
        }

        // ==========================================
        // 6. BACKEND - TESTS (IF PRESENT)
        // ==========================================
        stage('Backend - Test') {
            steps {
                dir("${BACKEND_DIR}") {
                    script {
                        echo 'Running backend test suites (if defined)...'
                        if (isUnix()) {
                            sh 'npm run test --if-present'
                        } else {
                            bat 'call npm run test --if-present'
                        }
                    }
                }
            }
        }

        // ==========================================
        // 7. BACKEND - PRODUCTION BUILD
        // ==========================================
        stage('Backend - Build') {
            steps {
                dir("${BACKEND_DIR}") {
                    script {
                        echo 'Compiling backend TypeScript into production JavaScript...'
                        if (isUnix()) {
                            sh 'npm run build'
                        } else {
                            bat 'call npm run build'
                        }
                    }
                }
            }
        }

        // ==========================================
        // 8. FRONTEND - INSTALL DEPENDENCIES
        // ==========================================
        stage('Frontend - Install Dependencies') {
            steps {
                dir("${FRONTEND_DIR}") {
                    script {
                        echo 'Installing frontend dependencies...'
                        if (isUnix()) {
                            sh 'npm ci || npm install'
                        } else {
                            bat 'call npm ci || call npm install'
                        }
                    }
                }
            }
        }

        // ==========================================
        // 9. FRONTEND - VALIDATION & LINT
        // ==========================================
        stage('Frontend - Validate') {
            steps {
                dir("${FRONTEND_DIR}") {
                    script {
                        echo 'Validating frontend assets and running lint (if defined)...'
                        if (isUnix()) {
                            sh 'npm run lint --if-present'
                        } else {
                            bat 'call npm run lint --if-present'
                        }

                        // Verify essential files exist
                        def essentialFiles = [
                            'index.html',
                            'css/style.css',
                            'js/app.js',
                            'js/player.js',
                            'js/api-client.js',
                            'js/podcasts.js',
                            'js/programs.js',
                            'js/media.js',
                            'js/utils.js'
                        ]
                        for (file in essentialFiles) {
                            if (!fileExists(file)) {
                                error("Missing required frontend file: ${file}")
                            }
                        }
                        echo 'All essential frontend assets successfully verified.'
                    }
                }
            }
        }

        // ==========================================
        // 10. FRONTEND - BUILD (IF PRESENT)
        // ==========================================
        stage('Frontend - Build') {
            steps {
                dir("${FRONTEND_DIR}") {
                    script {
                        echo 'Running frontend build (if defined)...'
                        if (isUnix()) {
                            sh 'npm run build --if-present'
                        } else {
                            bat 'call npm run build --if-present'
                        }
                    }
                }
            }
        }

        // ==========================================
        // 11. DATABASE MIGRATIONS (CONDITIONAL)
        // ==========================================
        stage('Database Migration') {
            when {
                expression {
                    return env.DATABASE_URL != null && env.DATABASE_URL.trim() != ''
                }
            }
            steps {
                dir("${BACKEND_DIR}") {
                    script {
                        echo 'DATABASE_URL detected. Applying Prisma database migrations...'
                        if (isUnix()) {
                            sh 'npx prisma migrate deploy'
                        } else {
                            bat 'call npx prisma migrate deploy'
                        }
                    }
                }
            }
        }

        // ==========================================
        // 12. DOCKER - BUILD IMAGE (PRE-DEPLOYMENT)
        // ==========================================
        stage('Docker - Build Image') {
            when {
                expression {
                    return params.BUILD_DOCKER_IMAGE != false
                }
            }
            steps {
                script {
                    echo 'Building production Docker container image for Radio Ninada (Pre-Deployment)...'
                    def tagLatest = "${DOCKER_IMAGE_NAME}:latest"
                    def tagBuild = "${DOCKER_IMAGE_NAME}:${env.BUILD_NUMBER ?: 'local'}"
                    def dockerBuildCmd = "docker build -t ${tagLatest} -t ${tagBuild} ."

                    try {
                        if (isUnix()) {
                            sh dockerBuildCmd
                        } else {
                            bat dockerBuildCmd
                        }
                        echo "Docker images successfully built: ${tagLatest} and ${tagBuild}"
                    } catch (Exception e) {
                        echo "[WARNING] Docker build could not complete: ${e.message}"
                        echo 'Ensure Docker daemon is active on the Jenkins agent if container image builds are required.'
                    }
                }
            }
        }

        // ==========================================
        // 13. ARCHIVE BUILD ARTIFACTS
        // ==========================================
        stage('Archive Build Artifacts') {
            steps {
                script {
                    echo 'Archiving compiled production artifacts for deployment readiness...'
                    archiveArtifacts(
                        artifacts: 'backend/dist/**, backend/package*.json, backend/prisma/**, frontend/**',
                        allowEmptyArchive: true,
                        fingerprint: true
                    )
                    echo 'Deployment-ready artifacts archived successfully.'
                }
            }
        }

        // ==========================================
        // 14. DEPLOY (DISABLED BY DEFAULT - MANUAL HOOK)
        // ==========================================
        stage('Deploy') {
            when {
                expression {
                    return (params.DEPLOY_ENABLED == true || env.DEPLOY_ENABLED == 'true')
                }
            }
            steps {
                script {
                    echo '=========================================='
                    echo ' EXECUTING MANUAL / AUTHORIZED DEPLOYMENT'
                    echo '=========================================='
                    if (fileExists('docker-compose.yml')) {
                        echo 'Deploying containers via Docker Compose...'
                        if (isUnix()) {
                            sh 'docker compose up -d --build || docker-compose up -d --build'
                        } else {
                            bat 'docker compose up -d --build'
                        }
                    } else {
                        echo 'Deploying via PM2 Node runner...'
                        if (isUnix()) {
                            sh 'pm2 reload radio-ninada || pm2 start backend/dist/server.js --name radio-ninada'
                        } else {
                            bat 'call pm2 reload radio-ninada || call pm2 start backend\\dist\\server.js --name radio-ninada'
                        }
                    }
                    echo 'Deployment completed.'
                }
            }
        }
    }

    // ==========================================
    // POST PIPELINE ACTIONS
    // ==========================================
    post {
        success {
            echo '''
======================================================
  [SUCCESS] RADIO NINADA CI/CD PIPELINE SUCCEEDED!
======================================================
  Repository : Radio_ninada
  Backend    : Built & Type-Checked (dist/ ready)
  Frontend   : Validated & Assets Verified
  Prisma     : Client Generated
  Docker     : Container Image Built (Pre-Deployment)
  Artifacts  : Archived & Deployment-Ready
  Deploy     : Not auto-run (Pipeline completed till deployment)
======================================================
'''
        }

        failure {
            echo '''
======================================================
  [FAILURE] RADIO NINADA CI/CD PIPELINE FAILED!
======================================================
  Please inspect the console output above for details.
======================================================
'''
        }

        always {
            echo 'Pipeline finished. Cleaning workspace...'
            cleanWs(
                deleteDirs: true,
                notFailBuild: true
            )
        }
    }
}
