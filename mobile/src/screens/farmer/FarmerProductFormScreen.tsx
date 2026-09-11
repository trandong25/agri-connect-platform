import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import DateTimePicker, {
    DateTimePickerChangeEvent
} from "@react-native-community/datetimepicker"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import axios from "axios"
import { useEffect, useState } from "react"
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    View
} from "react-native"
import {
    ActivityIndicator,
    Button,
    Menu,
    Surface,
    Text,
    TextInput
} from "react-native-paper"

import type { FarmerStackParamList } from "../../navigation/farmer/FarmerNavigator"
import {
    createFarmerProduct,
    getCategories,
    getFarmerProductDetail,
    getUnits,
    updateFarmerProduct
} from "../../services/api/farmerProductService"
import type {
    Category,
    Unit
} from "../../types/product"
import {
    farmerColors,
    farmerStyles as styles
} from "./farmerStyles"

type Props = NativeStackScreenProps<
    FarmerStackParamList,
    "FarmerProductForm"
>

export default function FarmerProductFormScreen({
    navigation,
    route
}: Props) {
    const productId =
        route.params?.productId

    const isEditing =
        productId !== undefined

    const [categories, setCategories] =
        useState<Category[]>([])
    const [units, setUnits] =
        useState<Unit[]>([])
    const [categoryId, setCategoryId] =
        useState<number | null>(null)
    const [unitId, setUnitId] =
        useState<number | null>(null)

    const [name, setName] =
        useState("")
    const [description, setDescription] =
        useState("")
    const [origin, setOrigin] =
        useState("")
    const [price, setPrice] =
        useState("")
    const [
        stockQuantity,
        setStockQuantity
    ] = useState("")
    const [
        minimumOrderQuantity,
        setMinimumOrderQuantity
    ] = useState("1")

    const [
        harvestDate,
        setHarvestDate
    ] = useState<string | null>(null)
    const [
        expiryDate,
        setExpiryDate
    ] = useState<string | null>(null)

    const [
        showHarvestPicker,
        setShowHarvestPicker
    ] = useState(false)
    const [
        showExpiryPicker,
        setShowExpiryPicker
    ] = useState(false)
    const [
        categoryMenuVisible,
        setCategoryMenuVisible
    ] = useState(false)
    const [
        unitMenuVisible,
        setUnitMenuVisible
    ] = useState(false)

    const [isLoading, setIsLoading] =
        useState(true)
    const [
        isSubmitting,
        setIsSubmitting
    ] = useState(false)
    const [error, setError] =
        useState("")

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true)
                setError("")

                const [
                    categoryData,
                    unitData
                ] = await Promise.all([
                    getCategories(),
                    getUnits()
                ])

                setCategories(
                    categoryData
                )
                setUnits(unitData)

                if (
                    productId !==
                    undefined
                ) {
                    const product =
                        await getFarmerProductDetail(
                            productId
                        )

                    setCategoryId(
                        product.category
                    )
                    setUnitId(
                        product.unit
                    )
                    setName(
                        product.name
                    )
                    setDescription(
                        product.description
                    )
                    setOrigin(
                        product.origin
                    )
                    setPrice(
                        product.price
                    )
                    setStockQuantity(
                        product.stock_quantity
                    )
                    setMinimumOrderQuantity(
                        product.minimum_order_quantity
                    )
                    setHarvestDate(
                        product.harvest_date
                    )
                    setExpiryDate(
                        product.expiry_date
                    )
                }
            } catch {
                setError(
                    "Không thể tải dữ liệu sản phẩm."
                )
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [productId])

    const validateForm = () => {
        if (!name.trim()) {
            return "Vui lòng nhập tên sản phẩm."
        }

        if (!categoryId) {
            return "Vui lòng chọn danh mục."
        }

        if (!unitId) {
            return "Vui lòng chọn đơn vị."
        }

        if (
            !price ||
            Number(price) <= 0
        ) {
            return "Giá sản phẩm phải lớn hơn 0."
        }

        if (
            stockQuantity === "" ||
            Number(stockQuantity) < 0
        ) {
            return "Tồn kho không hợp lệ."
        }

        if (
            !minimumOrderQuantity ||
            Number(
                minimumOrderQuantity
            ) <= 0
        ) {
            return "Số lượng mua tối thiểu phải lớn hơn 0."
        }

        if (
            harvestDate &&
            expiryDate &&
            expiryDate < harvestDate
        ) {
            return "Hạn sử dụng không được trước ngày thu hoạch."
        }

        return null
    }

    const handleHarvestDateChange = (
        event: DateTimePickerChangeEvent,
        selectedDate: Date
    ) => {
        if (
            Platform.OS === "android"
        ) {
            setShowHarvestPicker(false)
        }

        const value =
            formatDateForApi(
                selectedDate
            )

        setHarvestDate(value)

        if (
            expiryDate &&
            expiryDate < value
        ) {
            setExpiryDate(null)
        }
    }

    const handleExpiryDateChange = (
        event: DateTimePickerChangeEvent,
        selectedDate: Date
    ) => {
        if (
            Platform.OS === "android"
        ) {
            setShowExpiryPicker(false)
        }

        setExpiryDate(
            formatDateForApi(
                selectedDate
            )
        )
    }

    const handleSubmit = async () => {
        const validationError =
            validateForm()

        if (validationError) {
            setError(
                validationError
            )
            return
        }

        if (
            categoryId === null ||
            unitId === null
        ) {
            return
        }

        try {
            setIsSubmitting(true)
            setError("")

            const data = {
                category: categoryId,
                unit: unitId,
                name: name.trim(),
                description:
                    description.trim(),
                origin: origin.trim(),
                price,
                stock_quantity:
                    stockQuantity,
                minimum_order_quantity:
                    minimumOrderQuantity,
                harvest_date:
                    harvestDate,
                expiry_date:
                    expiryDate
            }

            if (
                isEditing &&
                productId !== undefined
            ) {
                await updateFarmerProduct(
                    productId,
                    data
                )

                navigation.goBack()
                return
            }

            const createdProduct =
                await createFarmerProduct(
                    {
                        ...data,
                        status: "DRAFT"
                    }
                )

            navigation.replace(
                "FarmerProductImages",
                {
                    productId:
                        createdProduct.id
                }
            )
        } catch (requestError) {
            setError(
                getErrorMessage(
                    requestError
                )
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const selectedCategory =
        categories.find(
            item =>
                item.id ===
                categoryId
        )

    const selectedUnit =
        units.find(
            item =>
                item.id ===
                unitId
        )

    if (isLoading) {
        return (
            <View
                style={styles.center}
            >
                <ActivityIndicator
                    color={
                        farmerColors.primary
                    }
                />

                <Text>
                    Đang tải thông tin sản phẩm...
                </Text>
            </View>
        )
    }

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={
                Platform.OS === "ios"
                    ? "padding"
                    : undefined
            }
        >
            <ScrollView
                contentContainerStyle={
                    styles.formContent
                }
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Surface
                    elevation={1}
                    style={
                        styles.formSection
                    }
                >
                    <View
                        style={
                            styles.formTitleRow
                        }
                    >
                        <MaterialCommunityIcons
                            name="sprout-outline"
                            size={23}
                            color={
                                farmerColors.primary
                            }
                        />

                        <View
                            style={
                                styles.formTitleText
                            }
                        >
                            <Text
                                variant="titleMedium"
                                style={
                                    styles.bold
                                }
                            >
                                Thông tin cơ bản
                            </Text>

                            <Text
                                variant="bodySmall"
                                style={{
                                    color:
                                        farmerColors.textSecondary
                                }}
                            >
                                Thông tin chính của nông sản
                            </Text>
                        </View>
                    </View>

                    <TextInput
                        mode="outlined"
                        label="Tên sản phẩm"
                        placeholder="Ví dụ: Xoài cát Hòa Lộc"
                        value={name}
                        activeOutlineColor={
                            farmerColors.primary
                        }
                        cursorColor={
                            farmerColors.primary
                        }
                        style={
                            styles.formInput
                        }
                        onChangeText={
                            setName
                        }
                    />

                    <Menu
                        visible={
                            categoryMenuVisible
                        }
                        onDismiss={() =>
                            setCategoryMenuVisible(
                                false
                            )
                        }
                        anchor={
                            <Button
                                mode="outlined"
                                icon="shape-outline"
                                textColor={
                                    farmerColors.primary
                                }
                                style={
                                    styles.formOutlineButton
                                }
                                contentStyle={
                                    styles.formSelectButton
                                }
                                onPress={() =>
                                    setCategoryMenuVisible(
                                        true
                                    )
                                }
                            >
                                {selectedCategory
                                    ? selectedCategory.name
                                    : "Chọn danh mục"}
                            </Button>
                        }
                    >
                        {categories.map(
                            category => (
                                <Menu.Item
                                    key={
                                        category.id
                                    }
                                    title={
                                        category.name
                                    }
                                    onPress={() => {
                                        setCategoryId(
                                            category.id
                                        )
                                        setCategoryMenuVisible(
                                            false
                                        )
                                    }}
                                />
                            )
                        )}
                    </Menu>

                    <Menu
                        visible={
                            unitMenuVisible
                        }
                        onDismiss={() =>
                            setUnitMenuVisible(
                                false
                            )
                        }
                        anchor={
                            <Button
                                mode="outlined"
                                icon="scale-balance"
                                textColor={
                                    farmerColors.primary
                                }
                                style={
                                    styles.formOutlineButton
                                }
                                contentStyle={
                                    styles.formSelectButton
                                }
                                onPress={() =>
                                    setUnitMenuVisible(
                                        true
                                    )
                                }
                            >
                                {selectedUnit
                                    ? `${selectedUnit.name} (${selectedUnit.symbol})`
                                    : "Chọn đơn vị"}
                            </Button>
                        }
                    >
                        {units.map(
                            unit => (
                                <Menu.Item
                                    key={
                                        unit.id
                                    }
                                    title={`${unit.name} (${unit.symbol})`}
                                    onPress={() => {
                                        setUnitId(
                                            unit.id
                                        )
                                        setUnitMenuVisible(
                                            false
                                        )
                                    }}
                                />
                            )
                        )}
                    </Menu>

                    <TextInput
                        mode="outlined"
                        label="Nguồn gốc"
                        placeholder="Ví dụ: Đồng Nai"
                        value={origin}
                        activeOutlineColor={
                            farmerColors.primary
                        }
                        cursorColor={
                            farmerColors.primary
                        }
                        style={
                            styles.formInput
                        }
                        onChangeText={
                            setOrigin
                        }
                    />

                    <TextInput
                        mode="outlined"
                        label="Mô tả"
                        placeholder="Mô tả sản phẩm"
                        value={
                            description
                        }
                        activeOutlineColor={
                            farmerColors.primary
                        }
                        cursorColor={
                            farmerColors.primary
                        }
                        style={
                            styles.formInput
                        }
                        onChangeText={
                            setDescription
                        }
                        multiline
                        numberOfLines={4}
                    />
                </Surface>

                <Surface
                    elevation={1}
                    style={
                        styles.formSection
                    }
                >
                    <View
                        style={
                            styles.formTitleRow
                        }
                    >
                        <MaterialCommunityIcons
                            name="cash-multiple"
                            size={23}
                            color={
                                farmerColors.primary
                            }
                        />

                        <Text
                            variant="titleMedium"
                            style={
                                styles.bold
                            }
                        >
                            Giá và số lượng
                        </Text>
                    </View>

                    <TextInput
                        mode="outlined"
                        label="Giá bán"
                        value={price}
                        activeOutlineColor={
                            farmerColors.primary
                        }
                        cursorColor={
                            farmerColors.primary
                        }
                        style={
                            styles.formInput
                        }
                        onChangeText={
                            setPrice
                        }
                        keyboardType="decimal-pad"
                        right={
                            <TextInput.Affix
                                text="đ"
                            />
                        }
                    />

                    <TextInput
                        mode="outlined"
                        label="Số lượng tồn kho"
                        value={
                            stockQuantity
                        }
                        activeOutlineColor={
                            farmerColors.primary
                        }
                        cursorColor={
                            farmerColors.primary
                        }
                        style={
                            styles.formInput
                        }
                        onChangeText={
                            setStockQuantity
                        }
                        keyboardType="decimal-pad"
                        right={
                            selectedUnit ? (
                                <TextInput.Affix
                                    text={
                                        selectedUnit.symbol
                                    }
                                />
                            ) : undefined
                        }
                    />

                    <TextInput
                        mode="outlined"
                        label="Số lượng mua tối thiểu"
                        value={
                            minimumOrderQuantity
                        }
                        activeOutlineColor={
                            farmerColors.primary
                        }
                        cursorColor={
                            farmerColors.primary
                        }
                        style={
                            styles.formInput
                        }
                        onChangeText={
                            setMinimumOrderQuantity
                        }
                        keyboardType="decimal-pad"
                        right={
                            selectedUnit ? (
                                <TextInput.Affix
                                    text={
                                        selectedUnit.symbol
                                    }
                                />
                            ) : undefined
                        }
                    />
                </Surface>

                <Surface
                    elevation={1}
                    style={
                        styles.formSection
                    }
                >
                    <View
                        style={
                            styles.formTitleRow
                        }
                    >
                        <MaterialCommunityIcons
                            name="calendar-outline"
                            size={23}
                            color={
                                farmerColors.primary
                            }
                        />

                        <View
                            style={
                                styles.formTitleText
                            }
                        >
                            <Text
                                variant="titleMedium"
                                style={
                                    styles.bold
                                }
                            >
                                Thời gian
                            </Text>

                            <Text
                                variant="bodySmall"
                                style={{
                                    color:
                                        farmerColors.textSecondary
                                }}
                            >
                                Chọn ngày trên lịch
                            </Text>
                        </View>
                    </View>

                    <TextInput
                        mode="outlined"
                        label="Ngày thu hoạch"
                        value={
                            harvestDate
                                ? formatDateForDisplay(
                                    harvestDate
                                )
                                : ""
                        }
                        placeholder="Chọn ngày thu hoạch"
                        editable={false}
                        activeOutlineColor={
                            farmerColors.primary
                        }
                        style={
                            styles.formInput
                        }
                        onPressIn={() =>
                            setShowHarvestPicker(
                                true
                            )
                        }
                        right={
                            <TextInput.Icon
                                icon="calendar"
                                color={
                                    farmerColors.primary
                                }
                                onPress={() =>
                                    setShowHarvestPicker(
                                        true
                                    )
                                }
                            />
                        }
                    />

                    {harvestDate && (
                        <Button
                            mode="text"
                            icon="close"
                            textColor={
                                farmerColors.primary
                            }
                            onPress={() =>
                                setHarvestDate(
                                    null
                                )
                            }
                        >
                            Bỏ ngày thu hoạch
                        </Button>
                    )}

                    {showHarvestPicker && (
                        <View>
                            <DateTimePicker
                                value={
                                    harvestDate
                                        ? parseApiDate(
                                            harvestDate
                                        )
                                        : new Date()
                                }
                                mode="date"
                                display={
                                    Platform.OS ===
                                    "ios"
                                        ? "spinner"
                                        : "default"
                                }
                                onValueChange={
                                    handleHarvestDateChange
                                }
                                onDismiss={() =>
                                    setShowHarvestPicker(
                                        false
                                    )
                                }
                            />

                            {Platform.OS ===
                                "ios" && (
                                <Button
                                    mode="text"
                                    textColor={
                                        farmerColors.primary
                                    }
                                    onPress={() =>
                                        setShowHarvestPicker(
                                            false
                                        )
                                    }
                                >
                                    Xong
                                </Button>
                            )}
                        </View>
                    )}

                    <TextInput
                        mode="outlined"
                        label="Hạn sử dụng"
                        value={
                            expiryDate
                                ? formatDateForDisplay(
                                    expiryDate
                                )
                                : ""
                        }
                        placeholder="Chọn hạn sử dụng"
                        editable={false}
                        activeOutlineColor={
                            farmerColors.primary
                        }
                        style={
                            styles.formInput
                        }
                        onPressIn={() =>
                            setShowExpiryPicker(
                                true
                            )
                        }
                        right={
                            <TextInput.Icon
                                icon="calendar"
                                color={
                                    farmerColors.primary
                                }
                                onPress={() =>
                                    setShowExpiryPicker(
                                        true
                                    )
                                }
                            />
                        }
                    />

                    {expiryDate && (
                        <Button
                            mode="text"
                            icon="close"
                            textColor={
                                farmerColors.primary
                            }
                            onPress={() =>
                                setExpiryDate(
                                    null
                                )
                            }
                        >
                            Bỏ hạn sử dụng
                        </Button>
                    )}

                    {showExpiryPicker && (
                        <View>
                            <DateTimePicker
                                value={
                                    expiryDate
                                        ? parseApiDate(
                                            expiryDate
                                        )
                                        : harvestDate
                                            ? parseApiDate(
                                                harvestDate
                                            )
                                            : new Date()
                                }
                                mode="date"
                                minimumDate={
                                    harvestDate
                                        ? parseApiDate(
                                            harvestDate
                                        )
                                        : undefined
                                }
                                display={
                                    Platform.OS ===
                                    "ios"
                                        ? "spinner"
                                        : "default"
                                }
                                onValueChange={
                                    handleExpiryDateChange
                                }
                                onDismiss={() =>
                                    setShowExpiryPicker(
                                        false
                                    )
                                }
                            />

                            {Platform.OS ===
                                "ios" && (
                                <Button
                                    mode="text"
                                    textColor={
                                        farmerColors.primary
                                    }
                                    onPress={() =>
                                        setShowExpiryPicker(
                                            false
                                        )
                                    }
                                >
                                    Xong
                                </Button>
                            )}
                        </View>
                    )}
                </Surface>

                {!!error && (
                    <Surface
                        elevation={0}
                        style={
                            styles.formErrorBox
                        }
                    >
                        <MaterialCommunityIcons
                            name="alert-circle-outline"
                            size={20}
                            color={
                                farmerColors.danger
                            }
                        />

                        <Text
                            style={
                                styles.formErrorText
                            }
                        >
                            {error}
                        </Text>
                    </Surface>
                )}

                {!isEditing && (
                    <Surface
                        elevation={0}
                        style={
                            styles.formInfoBox
                        }
                    >
                        <MaterialCommunityIcons
                            name="information-outline"
                            size={20}
                            color={
                                farmerColors.primary
                            }
                        />

                        <Text
                            variant="bodySmall"
                            style={
                                styles.formInfoText
                            }
                        >
                            Sản phẩm sẽ được lưu ở trạng thái bản nháp. Bước tiếp theo bạn sẽ thêm ảnh và để hệ thống kiểm tra ảnh trước khi đăng bán.
                        </Text>
                    </Surface>
                )}

                <Button
                    mode="contained"
                    icon={
                        isEditing
                            ? "content-save-outline"
                            : "arrow-right"
                    }
                    buttonColor={
                        farmerColors.primary
                    }
                    textColor="#FFFFFF"
                    loading={
                        isSubmitting
                    }
                    disabled={
                        isSubmitting
                    }
                    contentStyle={
                        styles.formSubmitButton
                    }
                    onPress={
                        handleSubmit
                    }
                >
                    {isEditing
                        ? "Lưu thay đổi"
                        : "Tiếp tục thêm ảnh"}
                </Button>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

function formatDateForApi(
    date: Date
) {
    const year =
        date.getFullYear()

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0")

    const day = String(
        date.getDate()
    ).padStart(2, "0")

    return `${year}-${month}-${day}`
}

function formatDateForDisplay(
    value: string
) {
    const [
        year,
        month,
        day
    ] = value.split("-")

    return `${day}/${month}/${year}`
}

function parseApiDate(
    value: string
) {
    const [
        year,
        month,
        day
    ] = value
        .split("-")
        .map(Number)

    return new Date(
        year,
        month - 1,
        day
    )
}

function getErrorMessage(
    error: unknown
) {
    if (
        !axios.isAxiosError(
            error
        )
    ) {
        return "Đã xảy ra lỗi. Vui lòng thử lại."
    }

    const data =
        error.response?.data

    if (
        data &&
        typeof data === "object"
    ) {
        for (
            const value of
            Object.values(data)
        ) {
            if (
                Array.isArray(
                    value
                ) &&
                typeof value[0] ===
                    "string"
            ) {
                return value[0]
            }

            if (
                typeof value ===
                "string"
            ) {
                return value
            }
        }
    }

    return "Không thể lưu sản phẩm."
}