import React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { UseFieldArrayRemove } from "react-hook-form"

type Fields = {
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  passport_number: string
}

type Props = {
  fields: Fields[]
  append: (field: Fields) => void
  remove: UseFieldArrayRemove
  register: any
  errors: any
}

const StepTwo = ({ fields, append, remove, register, errors }: Props) => {
  return (
    <div>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Passenger Details
          </CardTitle>
          <CardDescription>Enter information for each traveler</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {fields.map((_, index) => (
            <div key={index} className="space-y-4">
              {index > 0 && <Separator />}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Passenger {index + 1}</h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-destructive"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    {...register(`passengers.${index}.first_name`)}
                    placeholder="John"
                  />
                  {errors.passengers?.[index]?.first_name && (
                    <p className="text-xs text-destructive">
                      {errors.passengers[index]?.first_name?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    {...register(`passengers.${index}.last_name`)}
                    placeholder="Doe"
                  />
                  {errors.passengers?.[index]?.last_name && (
                    <p className="text-xs text-destructive">
                      {errors.passengers[index]?.last_name?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    {...register(`passengers.${index}.email`)}
                    placeholder="john@example.com"
                  />
                  {errors.passengers?.[index]?.email && (
                    <p className="text-xs text-destructive">
                      {errors.passengers[index]?.email?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    {...register(`passengers.${index}.phone`)}
                    placeholder="+1 234 567 890"
                  />
                  {errors.passengers?.[index]?.phone && (
                    <p className="text-xs text-destructive">
                      {errors.passengers[index]?.phone?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    {...register(`passengers.${index}.date_of_birth`)}
                  />
                  {errors.passengers?.[index]?.date_of_birth && (
                    <p className="text-xs text-destructive">
                      {errors.passengers[index]?.date_of_birth?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Passport Number</Label>
                  <Input
                    {...register(`passengers.${index}.passport_number`)}
                    placeholder="A12345678"
                  />
                  {errors.passengers?.[index]?.passport_number && (
                    <p className="text-xs text-destructive">
                      {errors.passengers[index]?.passport_number?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full"
            onClick={() =>
              append({
                first_name: "",
                last_name: "",
                email: "",
                phone: "",
                date_of_birth: "",
                passport_number: "",
              })
            }
          >
            <Users className="mr-2 h-4 w-4" />
            Add Passenger
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default StepTwo
