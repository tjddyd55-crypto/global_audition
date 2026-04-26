type AuditionsPageHeaderProps = {
  title: string
  description?: string
  className?: string
  titleClassName?: string
  titleStyle?: React.CSSProperties
  descriptionStyle?: React.CSSProperties
  style?: React.CSSProperties
}

export default function AuditionsPageHeader({
  title,
  description,
  className,
  titleClassName,
  titleStyle,
  descriptionStyle,
  style,
}: AuditionsPageHeaderProps) {
  return (
    <div
      className={className}
      style={{
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
        ...style,
      }}
    >
      <h1 className={titleClassName} style={titleStyle}>
        {title}
      </h1>
      {description ? <p style={descriptionStyle}>{description}</p> : null}
    </div>
  )
}
