import { ref, computed, watch } from 'vue'

export function useForm<T extends Record<string, any>>(initialValues: T) {
  const values = ref({ ...initialValues }) as any
  const errors = ref<Record<string, string>>({})
  const touched = ref<Record<string, boolean>>({})
  const isSubmitting = ref(false)
  
  // Unused variable - should be flagged
  const unusedHelper = ref('test')
  
  function validate() {
    const newErrors: Record<string, string> = {}
    // Validation logic would go here
    errors.value = newErrors
    return Object.keys(newErrors).length === 0
  }
  
  function setFieldValue(field: string, value: any) {
    values.value[field] = value
    touched.value[field] = true
  }
  
  function setFieldError(field: string, error: string) {
    errors.value[field] = error
  }
  
  function resetForm() {
    values.value = { ...initialValues }
    errors.value = {}
    touched.value = {}
    isSubmitting.value = false
  }
  
  const isValid = computed(() => Object.keys(errors.value).length === 0)
  const isDirty = computed(() => JSON.stringify(values.value) !== JSON.stringify(initialValues))
  
  // Watch for changes and validate
  watch(values, () => {
    if (Object.keys(touched.value).length > 0) {
      validate()
    }
  }, { deep: true })
  
  async function handleSubmit(onSubmit: (values: T) => Promise<void>) {
    isSubmitting.value = true
    touched.value = Object.keys(initialValues).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as Record<string, boolean>)
    
    if (validate()) {
      try {
        await onSubmit(values.value as T)
      }
      catch (e) {
        // Handle submission error
      }
    }
    
    isSubmitting.value = false
  }
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    validate,
    setFieldValue,
    setFieldError,
    resetForm,
    handleSubmit,
  }
}
