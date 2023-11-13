pipeline {
    agent {
      node {
        label 'azureworkeragent'
      }
    }
    options { 
      skipStagesAfterUnstable() 
      ansiColor('xterm')
    }
    tools {
      nodejs 'nodejs-16'
    }
    environment {
      registryName='communication'
      registryUrl='https://cassbanaprojectx.azurecr.io'
      registryTag='cassbanaprojectx.azurecr.io'
      registryCredential='ACR-ProjectX'
      dockerImage=''
      buildImage=''
      buildTagName="${env.BRANCH_NAME}-${env.BUILD_ID}"
      buildImageName="comm-build:${env.BRANCH_NAME}-${env.BUILD_ID}"
      label='dev'
      tag='no-tag'
      teamsUrl=credentials('projectx-teams-webhook')
    }    
    stages{
        stage('Prepare'){
          steps{
            script{
              buildTagName = buildTagName.replace("/","-")
              buildImageName = buildImageName.replace("/","-")
            }
          }
        }
        stage('Build'){
            steps{
              withCredentials([file(credentialsId: 'cassbana-github-npmrc', variable: 'NPMRC')]) {
                sh "cp ${NPMRC} ${WORKSPACE}/.npmrc"
                script {
                buildImage = docker.build("${buildImageName}","--rm=true -f Dockerfiles/Dockerfile.build .")
                }                
              }
            }
        }
        stage('Test'){
          steps{
              echo 'test should be run on docker build'
//               script {
//                 buildImage.inside('-u root:root') {
//                   sh '(cd /opt/comm && pwd && npm run test:cov)'
//                   sh "cp -R /opt/comm/reports ${WORKSPACE}"
//                   sh "cp -R /opt/comm/coverage ${WORKSPACE}"
//                 }
//               }
            }
        }
        stage('Sonarqube') {
          when {
            anyOf {
              branch 'develop'; branch 'main'
            }
          }
          steps{
              echo 'Analyze code using sonarqube scanner'
              script {
                def scannerHome = tool 'sonarscanner-4.7'
                withSonarQubeEnv('Main SonarQube') {
                  sh "${scannerHome}/bin/sonar-scanner"
                }
              }
            }
        }
        
        stage('Build Docker Image'){
          when {
            anyOf {
              branch 'develop'; branch 'main'; branch 'integration'; branch 'qa'
            }
          }
          steps {
            script {
              if(label == 'latest') {
                tag = 'latest'
              } else if (label == 'stable') {
                tag = "0.1-${env.BUILD_ID}"
              } else {
                tag ="0.1-${env.BRANCH_NAME}-${env.BUILD_ID}"
              }
              tag = tag.replace("/","-")
              dockerImage = docker.build("${registryName}:${tag}","--build-arg TAG=${buildTagName} --rm=true -f Dockerfiles/Dockerfile.prod .")
            }
          }
        }
        stage('Publish images to ACR'){
          when {
            anyOf {
              branch 'develop'; branch 'main'; branch 'integration'; branch 'qa'
            }
          }
          steps{
            script{            
              docker.withRegistry(registryUrl, registryCredential) {
                dockerImage.push()
                dockerImage.push('latest')
              }
            }
          }
        }        
    }
    post{
        always{
            archiveArtifacts artifacts: 'src/**/*.ts', fingerprint: true
            // junit 'junit.xml'
            
            cleanWs(cleanWhenNotBuilt: false,
                    deleteDirs: true,
                    disableDeferredWipeout: true,
                    notFailBuild: true,
                    patterns: [[pattern: '.gitignore', type: 'INCLUDE'],
                               [pattern: '.npmrc', type: 'INCLUDE'],
                               [pattern: '.propsfile', type: 'EXCLUDE']])
            echo 'Remove docker build image'
            sh "docker rmi ${buildImageName}"
            script {
              echo 'Remove docker published image'
              if(tag != 'no-tag'){
                sh "docker rmi ${registryTag}/${registryName}"
                sh "docker rmi ${registryTag}/${registryName}:${tag}"
                sh "docker rmi ${registryName}:${tag}"
              }
            }
        }
        success{
            echo '========pipeline executed successfully ========'
            office365ConnectorSend color: '#00ff00', 
                                   message: "Communication service build ${env.BUILD_ID} succeeded on ${env.BRANCH_NAME}.(space, space)New image published to ${registryTag}/${registryName}:${tag}.", 
                                   status: 'Success', 
                                   webhookUrl: "${teamsUrl}"
        }
        failure{
            echo '========pipeline execution failed========'
            office365ConnectorSend color: '#ff0000', 
                                   message: "Communication service build ${env.BUILD_ID} failed on ${env.BRANCH_NAME}.(space, space)", 
                                   status: 'Failure', 
                                   webhookUrl: "${teamsUrl}"
        }
    }
}
