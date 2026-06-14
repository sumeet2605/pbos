import type { ReactNode } from 'react'
import { Button, Empty, Flex, Result, Spin, Typography } from 'antd'

interface LoadingStateProps {
  title?: string
  description?: string
}

export function LoadingState({
  title = 'Loading',
  description = 'Please wait while we load your data.',
}: LoadingStateProps) {
  return (
    <Flex vertical align="center" justify="center" gap={16} style={{ minHeight: 240 }}>
      <Spin size="large" />
      <div style={{ textAlign: 'center' }}>
        <Typography.Title level={4} style={{ marginBottom: 8 }}>
          {title}
        </Typography.Title>
        <Typography.Text type="secondary">{description}</Typography.Text>
      </div>
    </Flex>
  )
}

interface ErrorStateProps {
  title?: string
  description: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Unable to load data',
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <Result
      status="error"
      title={title}
      subTitle={description}
      extra={
        onRetry ? (
          <Button type="primary" onClick={onRetry}>
            Retry
          </Button>
        ) : null
      }
    />
  )
}

interface EmptyStateProps {
  description: string
  action?: ReactNode
}

export function EmptyState({ description, action }: EmptyStateProps) {
  return <Empty description={description}>{action}</Empty>
}
