/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited! Here is your MOXIEMO access.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={text}>Hi there,</Text>
        <Text style={text}>
          Your member access is ready. You are officially part of the MOXIEMO circle.
        </Text>
        <Text style={text}>Here is what happens next:</Text>
        <Text style={text}>
          Click the button below to create your password and activate your account and
          complete your Brand Discovery. This is where MOXIEMO learns your positioning,
          voice, and content strategy. It takes about 10-15 minutes. Your Marketing
          Planner will be ready immediately after Discovery is complete.
        </Text>
        <Text style={text}>
          If you're a Founding Member, your access is free forever. No credit card, no
          trial period, no catch.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Activate your account →
        </Button>
        <Text style={text}>
          If you have any questions before you get started, reply to this email directly.
        </Text>
        <Text style={text}>
          Welcome to MOXIEMO,<br />
          Your Chief AI Marketing Officer
        </Text>
        <Text style={text}>
          Karee<br />
          Founder, MOXIE<br />
          <Link href="mailto:hello@buildwithmoxiemo.com" style={link}>hello@buildwithmoxiemo.com</Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif", color: '#262833' }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#262833',
  margin: '0 0 24px',
  letterSpacing: '-0.01em',
}
const text = {
  fontSize: '14px',
  color: '#3c3f50',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const link = { color: 'inherit', textDecoration: 'underline' }
const button = {
  backgroundColor: '#ff6b6b',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '12px',
  padding: '14px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#8a8d9b', margin: '32px 0 0', lineHeight: '1.5' }
