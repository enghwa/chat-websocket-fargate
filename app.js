const cdk = require('@aws-cdk/cdk');
const ecs = require('@aws-cdk/aws-ecs');
const ec2 = require('@aws-cdk/aws-ec2');
const ecs_patterns = require('@aws-cdk/aws-ecs-patterns');
const elasticache = require('@aws-cdk/aws-elasticache');
const iam = require('@aws-cdk/aws-iam');

class BaseInfraResources extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    // VPC Network to run everything in
    this.vpc = new ec2.Vpc(this, 'vpc', {
      maxAZs: 3,
      natGateways: 1
    });

    // ECS Cluster all the containers will run in
    this.cluster = new ecs.Cluster(this, 'cluster', { vpc: this.vpc });

    // Elasticache Redis
    const subnetGroup = new elasticache.CfnSubnetGroup(this, `${id}-subnet-group`, {
      description: `List of subnets used for redis cache ${id}`,
      subnetIds: this.vpc.privateSubnets.map(function (subnet) {
        return subnet.subnetId;
      })
    });
    // The security group that defines network level access to the cluster
    this.securityGroup = new ec2.SecurityGroup(this, `${id}-security-group`, { vpc: this.vpc });
    // this.connections = new ec2.Connections({
    //   securityGroups: [this.securityGroup],
    //   defaultPortRange: new ec2.TcpPort(6379)
    // });

    // mySecurityGroup.addIngressRule(new ec2.AnyIPv4(), new ec2.TcpPort(22), 'allow ssh access from the world'); //new ec2.CidrIPv4(this.vpc.cidr)
    this.securityGroup.addIngressRule(new ec2.AnyIPv4(), new ec2.TcpPort(6379), 'redis security group');

    this.redisCluster = new elasticache.CfnCacheCluster(this, `${id}-cluster`, {
      cacheNodeType: 'cache.t2.micro',
      engine: 'redis',
      numCacheNodes: 1,
      engineVersion: '3.2.10',
      autoMinorVersionUpgrade: true,
      cacheSubnetGroupName: subnetGroup.subnetGroupName,
      vpcSecurityGroupIds: [
        this.securityGroup.securityGroupId
      ]
    });

  }
}

class chatroom extends cdk.Stack {
  constructor(parent, id, props) {
    super(parent, id, props);

    this.chatroom = new ecs_patterns.LoadBalancedFargateService(this, 'chatroom', {
      cluster: props.cluster,
      image: ecs.ContainerImage.fromAsset(this, 'chatroom-image', {
        directory: './chatroom'
      }),
      containerPort: 3000,
      desiredCount: 3,
      cpu: '256',
      memory: '512',
      environment: {
        APP_PORT: '3000',
        REDIS_URL: 'redis://' + props.redisCluster.cacheClusterRedisEndpointAddress + ':6379',
        AWS_XRAY_CONTEXT_MISSING: 'LOG_ERROR'
      },
      createLogs: true
    })

    // set targetgroup to be sticky as we have multiple tasks running websocket!
    this.chatroom.targetGroup.enableCookieStickiness(1000)

    this.chatroom.service.taskDefinition.addContainer('xray', {
      image: ecs.ContainerImage.fromRegistry('amazon/aws-xray-daemon'),
      logging: new ecs.AwsLogDriver(this, 'xray-worker-logs', {
        streamPrefix: 'xray-worker'
      })
    }).addPortMappings({
      containerPort: 2000,
      protocol: ecs.Protocol.Udp
    })

    //xray iam permission
    this.chatroom.service.taskDefinition.taskRole.addToPolicy(
      new iam.PolicyStatement()
        .addAction('xray:PutTraceSegments')
        .allow()
        .addResource('*')
    )

    // new cdk.CfnOutput(this, 'LoadBalancerDNS', { value: this.chatroom.loadBalancer.loadBalancerDnsName });
  }
}



class App extends cdk.App {
  constructor(argv) {
    super(argv);

    this.baseResources = new BaseInfraResources(this, 'Chatroom-base-infra');

    this.chatroom = new chatroom(this, 'chatroom', {
      cluster: this.baseResources.cluster,
      redisCluster: this.baseResources.redisCluster
    });

  }
}

new App().run();
