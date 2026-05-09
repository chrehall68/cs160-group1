import { useState } from 'react'
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker'

const pad = (n) => String(n).padStart(2, '0')

const toDate = (d) => {
  if (d instanceof Date) return d
  if (d && typeof d.toDate === 'function') return d.toDate()
  return new Date(d)
}

// value is stored as MM/DD/YYYY
function mmddyyyyToDate(value) {
  const [m, d, y] = value.split('/')
  if (!m || !d || !y) return undefined
  return new Date(Number(y), Number(m) - 1, Number(d))
}

function dateToMMDDYYYY(d) {
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`
}

export default function DatePickerField({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select a date',
  initialView = 'day',
  defaultDate,
}) {
  const [open, setOpen] = useState(false)
  const styles = useDefaultStyles()
  const dateValue = mmddyyyyToDate(value)
  // When no date is selected yet, position the picker at defaultDate.
  const initialPos = !dateValue && defaultDate ? defaultDate : null

  return (
    <View style={fieldStyles.field}>
      {label ? <Text style={fieldStyles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={fieldStyles.input}
        onPress={() => setOpen(true)}
      >
        <Text style={{ color: value ? '#000' : '#999' }}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={fieldStyles.backdrop}
          onPress={() => setOpen(false)}
        >
          <Pressable style={fieldStyles.card}>
            <DateTimePicker
              mode="single"
              date={dateValue}
              minDate={minDate}
              maxDate={maxDate}
              initialView={initialView}
              year={initialPos ? initialPos.getFullYear() : undefined}
              month={initialPos ? initialPos.getMonth() : undefined}
              onChange={({ date }) => {
                if (!date) return
                onChange(dateToMMDDYYYY(toDate(date)))
                setOpen(false)
              }}
              styles={styles}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const fieldStyles = StyleSheet.create({
  field: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
})
