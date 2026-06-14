import { ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Col, Form, Input, Row, Select } from 'antd'
import { Controller, DefaultValues, FieldValues, Path, useForm } from 'react-hook-form'
import { ZodType } from 'zod'

type FieldType = 'text' | 'textarea' | 'password' | 'select'

interface SelectOption {
  label: string
  value: string
}

interface EntityField<T extends FieldValues> {
  name: Path<T>
  label: string
  type?: FieldType
  placeholder?: string
  options?: SelectOption[]
  span?: number
  disabled?: boolean
}

interface EntityFormProps<T extends FieldValues> {
  schema: ZodType<T>
  defaultValues: DefaultValues<T>
  fields: EntityField<T>[]
  submitText: string
  onSubmit: (values: T) => Promise<void> | void
  footer?: ReactNode
}

function renderField(type: FieldType, options?: SelectOption[], disabled?: boolean) {
  switch (type) {
    case 'password':
      return <Input.Password disabled={disabled} />
    case 'textarea':
      return <Input.TextArea rows={4} disabled={disabled} />
    case 'select':
      return <Select options={options} disabled={disabled} />
    default:
      return <Input disabled={disabled} />
  }
}

export function EntityForm<T extends FieldValues>({
  schema,
  defaultValues,
  fields,
  submitText,
  onSubmit,
  footer,
}: EntityFormProps<T>) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  return (
    <Form layout="vertical" onFinish={handleSubmit(async (values) => onSubmit(values))}>
      <Row gutter={[16, 0]}>
        {fields.map((field) => {
          const fieldType = field.type ?? 'text'
          return (
            <Col key={field.name} xs={24} md={field.span ?? 24}>
              <Controller
                name={field.name}
                control={control}
                render={({ field: controllerField }) => (
                  <Form.Item
                    label={field.label}
                    validateStatus={errors[field.name] ? 'error' : undefined}
                    help={errors[field.name]?.message as string | undefined}
                  >
                    {fieldType === 'select' ? (
                      <Select
                        value={controllerField.value}
                        onChange={controllerField.onChange}
                        onBlur={controllerField.onBlur}
                        options={field.options}
                        placeholder={field.placeholder}
                        disabled={field.disabled || isSubmitting}
                      />
                    ) : fieldType === 'textarea' ? (
                      <Input.TextArea
                        rows={4}
                        value={(controllerField.value as string | undefined) ?? ''}
                        onChange={controllerField.onChange}
                        onBlur={controllerField.onBlur}
                        placeholder={field.placeholder}
                        disabled={field.disabled || isSubmitting}
                      />
                    ) : fieldType === 'password' ? (
                      <Input.Password
                        value={(controllerField.value as string | undefined) ?? ''}
                        onChange={controllerField.onChange}
                        onBlur={controllerField.onBlur}
                        placeholder={field.placeholder}
                        disabled={field.disabled || isSubmitting}
                      />
                    ) : (
                      <Input
                        value={(controllerField.value as string | undefined) ?? ''}
                        onChange={controllerField.onChange}
                        onBlur={controllerField.onBlur}
                        placeholder={field.placeholder}
                        disabled={field.disabled || isSubmitting}
                      />
                    )}
                  </Form.Item>
                )}
              />
            </Col>
          )
        })}
      </Row>
      <Form.Item style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            {submitText}
          </Button>
          {footer}
        </div>
      </Form.Item>
    </Form>
  )
}
