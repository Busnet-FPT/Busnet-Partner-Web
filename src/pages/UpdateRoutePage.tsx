import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

const emptyForm: RouteFormData = {
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
}

// -----------------------------------------------------------
// Normalizes the API route document into RouteFormData.
//
// The API response includes extra fields RouteFormData doesn't need
// (_id, partnerId, lat/lng, distanceKm, timestamps, etc.) — picking
// only the fields we want keeps the form state clean and future-proof
// if the API adds more fields later. Falls back to '' / true / false
// for any field that's ever missing, so controlled inputs never go
// undefined.
// -----------------------------------------------------------
const normalizeRoute = (raw: any): RouteFormData => ({
    routeName: raw.routeName ?? '',

    origin_province: raw.origin_province ?? '',
    origin_provinceName: raw.origin_provinceName ?? '',
    origin_district: raw.origin_district ?? '',
    origin_districtName: raw.origin_districtName ?? '',
    origin_representativeAddress: raw.origin_representativeAddress ?? '',

    destination_province: raw.destination_province ?? '',
    destination_provinceName: raw.destination_provinceName ?? '',
    destination_district: raw.destination_district ?? '',
    destination_districtName: raw.destination_districtName ?? '',
    destination_representativeAddress: raw.destination_representativeAddress ?? '',

    isActive: raw.isActive ?? true,
    isPopular: raw.isPopular ?? false,
})

function UpdateRoutePage() {
    const navigate = useNavigate()

    const [errors, setErrors] = useState<
        ValidationError[]
    >([])

    const [form, setForm] = useState<RouteFormData>(emptyForm)

    const [loading, setLoading] = useState(false)
    const { id } = useParams()

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
            await api.put(`/partner/routes/${id}`, form)

            toast.success('Route updated successfully')

            navigate('/routes')
        } catch (error) {
            toast.error('Failed to update route')
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

    useEffect(() => {
        if (id) {
            loadRoute(id)
        }
    }, [id])

    const loadRoute = async (id: string) => {
        try {
            setLoading(true)

            const res = await api.get(`/partner/routes/${id}`)

            console.log('raw:', res.data.data)
            console.log('normalized:', normalizeRoute(res.data.data))

            setForm(normalizeRoute(res.data.data))
        } catch (error) {
            toast.error("Failed to load route")
            navigate("/routes")
        } finally {
            setLoading(false)
        }
    }

    return (
        <RouteForm
            form={form}
            errors={errors}
            loading={loading}
            title="Update Route"
            submitText="Update Route"
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/routes')}
        />
    )

}

export default UpdateRoutePage