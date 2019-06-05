
## Architecture:
ref to fargate-redis-chat.pptx.

### get nodejs
```bash

nvm install 8.12.0 

nvm alias default v8.12.0
```

### install node modules
```bash
npm install
```

### show the aw resources that cdk will create

```bash
npx cdk diff
```

### make sure your aws cli is setup (eg: aws cloudformation), deploy the aws resources
```bash

npx cdk deploy --require-approval never

```

