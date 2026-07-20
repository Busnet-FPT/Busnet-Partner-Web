import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'

import { toast } from "sonner";
import RouteForm from './RouteForm';

export interface RouteFormData {
    routeName: string

    origin_province: string
    origin_provinceName: string

    destination_province: string
    destination_provinceName: string

    origin_district: string
    origin_districtName: string

    destination_district: string
    destination_districtName: string

    origin_representativeAddress: string
    destination_representativeAddress: string

    isActive: boolean
    isPopular: boolean

}

export interface ValidationError {
    field: string
    message: string
}

export const validateRoute = (form: RouteFormData): ValidationError[] => {
    const errors: ValidationError[] = []

    // -------------------
    // routeName
    // -------------------
    if (!form.routeName?.trim()) {
        errors.push({
            field: 'routeName',
            message: 'Route name is required',
        })
    } else if (
        form.routeName.length < 3 ||
        form.routeName.length > 100
    ) {
        errors.push({
            field: 'routeName',
            message:
                'Route name must be between 3 and 100 characters',
        })
    }

    // -------------------
    // origin_province
    // -------------------
    if (!form.origin_province?.trim()) {
        errors.push({
            field: 'origin_province',
            message: 'Origin province is required',
        })
    }

    // -------------------
    // origin_provinceName
    // -------------------
    if (!form.origin_provinceName?.trim()) {
        errors.push({
            field: 'origin_provinceName',
            message: 'Origin province name is required',
        })
    }

    // -------------------
    // destination_province
    // -------------------
    if (!form.destination_province?.trim()) {
        errors.push({
            field: 'destination_province',
            message: 'Destination province is required',
        })
    }

    // -------------------
    // province cannot be same
    // -------------------
    if (
        form.origin_province &&
        form.destination_province &&
        form.origin_province === form.destination_province
    ) {
        errors.push({
            field: 'destination_province',
            message:
                'Origin and destination provinces cannot be the same',
        })
    }

    if (!form.origin_representativeAddress.trim()) {
        errors.push({
            field: "origin_representativeAddress",
            message: "Origin representative address is required",
        })
    }

    if (!form.destination_representativeAddress.trim()) {
        errors.push({
            field: "destination_representativeAddress",
            message: "Destination representative address is required",
        })
    }

    return errors
}

function AddRoutePage() {
    const navigate = useNavigate()

    const [errors, setErrors] = useState<
        ValidationError[]
    >([])

    const [form, setForm] = useState<RouteFormData>({
        routeName: '',

        origin_province: '',
        origin_provinceName: '',
        origin_district: '',
        origin_districtName: '',
        origin_representativeAddress: '',

        destination_province: '',
        destination_provinceName: '',
        destination_district: '',
        destination_districtName: '',
        destination_representativeAddress: '',

        isActive: true,
        isPopular: false,
    })

    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const validationErrors = validateRoute(form)

        if (validationErrors.length > 0) {
            setErrors(validationErrors)
            return
        }

        setErrors([])
        setLoading(true)

        try {
            await api.post('/partner/routes', form)

            toast.success('Route created successfully')

            navigate('/routes')
        } catch (error) {
            toast.error('Failed to create route')
        } finally {
            setLoading(false)
        }
    }

    const handleFormChange = (
        field: keyof RouteFormData,
        value: RouteFormData[keyof RouteFormData]
    ) => {
        setForm(prev => ({
            ...prev,
            [field]: value,
        }))
    }

    return (
        <RouteForm
            form={form}
            errors={errors}
            loading={loading}
            title="Add Route"
            submitText="Create Route"
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/routes')}
        />
    )

}

export default AddRoutePage