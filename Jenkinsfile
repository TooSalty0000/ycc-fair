void setBuildStatus(String message, String state) {
  step([
      $class: "GitHubCommitStatusSetter",
      reposSource: [$class: "ManuallyEnteredRepositorySource", url: "https://github.com/TooSalty0000/ycc-fair"],
      contextSource: [$class: "ManuallyEnteredCommitContextSource", context: "ci/jenkins/build-status"],
      errorHandlers: [[$class: "ChangingBuildStatusErrorHandler", result: "UNSTABLE"]],
      statusResultSource: [ $class: "ConditionalStatusResultSource", results: [[$class: "AnyBuildResult", message: message, state: state]] ]
  ]);
}

pipeline {
    agent any

    stages {

        stage('Prepare Environment') {
            steps {
                script {
                    // Retrieve credentials from Jenkins Credentials
                    withCredentials([
                        string(credentialsId: 'GEMINI_API_KEY', variable: 'GEMINI_API_KEY'),
                        string(credentialsId: 'JWT_SECRET', variable: 'JWT_SECRET')
                    ]) {
                        // Create the .env.local file with the retrieved credentials
                        writeFile file: '.env.local', text: 
                        """
# Production environment variables
NODE_ENV=production
NEXT_PUBLIC_GEMINI_API_KEY=${GEMINI_API_KEY}
JWT_SECRET=${JWT_SECRET}
                        """
                        echo "Environment variables have been set."
                    }
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'echo Installing Node.js dependencies...'
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'echo Running ESLint...'
                sh 'npm run lint'
            }
        }

        stage('Build') {
            steps {
                sh 'echo Building Next.js application...'
                sh 'npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t ycc-fair:latest .'
            }
        }

        stage('Docker Compose Down') {
            steps {
                // First gracefully stop any existing containers
                sh 'docker-compose down || true'
                // Remove any orphaned containers that might cause issues
                sh 'docker-compose down --remove-orphans || true'
            }
        }

        stage('Docker Compose Up') {
            steps {
                // Force recreation of containers and don't reuse existing containers
                sh 'docker-compose up --build --force-recreate -d'
            }
        }

        stage('Health Check') {
            steps {
                script {
                    // Wait for application to be healthy
                    sh 'echo Waiting for application to start...'
                    sh 'sleep 30'
                    sh 'curl -f http://localhost:16181 || exit 1'
                    echo 'Application is running successfully!'
                }
            }
        }
    }

    post {
        always {
            script {
                // Remove temporary files after build
                sh 'rm -rf .env.local'
                // Clean up Docker build cache periodically
                sh 'docker system prune -f || true'
            }
        }
        success {
            setBuildStatus("Build succeeded", "SUCCESS");
        }
        failure {
            setBuildStatus("Build failed", "FAILURE");
        }
    }
}