type SeverityBadgeProps = {
  text: string;
};

function SeverityBadge({ text }: SeverityBadgeProps) {
  const normalizedText = text.toLowerCase();

  let className = "severity-badge severity-badge--gray";

  if (normalizedText.includes("leve") || normalizedText.includes("resuelto")) {
    className = "severity-badge severity-badge--green";
  }

  if (
    normalizedText.includes("moderado") ||
    normalizedText.includes("en proceso") ||
    normalizedText.includes("en revisión") ||
    normalizedText.includes("en revision")
  ) {
    className = "severity-badge severity-badge--yellow";
  }

  if (
    normalizedText.includes("crítico") ||
    normalizedText.includes("critico") ||
    normalizedText.includes("rechazado")
  ) {
    className = "severity-badge severity-badge--red";
  }

  if (normalizedText.includes("recibido")) {
    className = "severity-badge severity-badge--blue";
  }

  return <span className={className}>• {text}</span>;
}

export default SeverityBadge;
