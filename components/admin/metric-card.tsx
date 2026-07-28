import { TrendingUp } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function MetricCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  color = 'bg-blue-50',
  borderColor = 'border-blue-200',
}: {
  icon: any
  title: string
  value: string | number
  subtitle?: string
  trend?: string
  color?: string
  borderColor?: string
}) {
  return (
    <Card className={`${color} border-2 ${borderColor}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
        {trend && <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" /> {trend}
        </p>}
      </CardContent>
    </Card>
  )
}
