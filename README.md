
# get node
nvm install 8.12.0 nvm alias default v8.12.0

#install node modules
npm install

# show the aw resources that cdk will create
npx cdk diff

# make sure your aws cli is setup (eg: aws cloudformation), deploy the aws resources
npx cdk deploy --require-approval never

