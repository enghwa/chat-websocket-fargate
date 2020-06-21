import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import ecs = require('@aws-cdk/aws-ecs');
import logs = require('@aws-cdk/aws-logs');
import servicediscovery = require('@aws-cdk/aws-servicediscovery');
import ecs_patterns = require('@aws-cdk/aws-ecs-patterns');

export class Chat2Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Our VPC
    const vpc = new ec2.Vpc(this, "nodejs-vpc", {
      maxAzs: 2,
      natGateways: 1
    })

    const cluster = new ecs.Cluster(this, "ecs-cluster", {
      vpc,
      clusterName: "ChatCluster",
      defaultCloudMapNamespace: {
        name: "chat.service",
        type: servicediscovery.NamespaceType.DNS_PRIVATE
      }
    })
    // redis service
    const redisTask = new ecs.FargateTaskDefinition(this, "redisTask")
    redisTask.addContainer('redis', {
      image: ecs.ContainerImage.fromRegistry('redis'),
    }).addPortMappings({ containerPort: 6379 })

    const redisSv = new ecs.FargateService(this, 'redis', {
      cluster,
      taskDefinition: redisTask,
      desiredCount: 1,
      cloudMapOptions: {
        name: "redis",
        dnsRecordType: servicediscovery.DnsRecordType.A
      }
    })

    //chat app
    const chatApp = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "chat", {
      cluster,
      desiredCount: 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset('chatroom'),
        containerPort: 3000,
        logDriver: ecs.LogDrivers.awsLogs({
          streamPrefix: "chat",
          logRetention: logs.RetentionDays.TWO_MONTHS
        }),
        environment: {
          'APP_PORT': '3000',
          'REDIS_URL': 'redis://redis.chat.service:6379'
        }
      }
    })

    redisSv.connections.allowFrom(chatApp.service.connections, ec2.Port.tcp(6379))
  }
}