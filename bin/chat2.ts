#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { Chat2Stack } from '../lib/chat2-stack';

const app = new cdk.App();
new Chat2Stack(app, 'Chat2Stack');
