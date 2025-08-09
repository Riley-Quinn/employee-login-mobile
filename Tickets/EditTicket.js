import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import StatusTracker from './StatusTracker';
import { BASE_URL } from '@env';

const validationSchema = Yup.object({
  status_id: Yup.string().required('Status is required'),
  pending_reason: Yup.string().nullable(),
  onhold_reason: Yup.string().nullable(),
});

const EditTicket = ({ onClose, employeeTicketData, fetchData, userId }) => {
  return (
    <Formik
      initialValues={{
        status_id: String(employeeTicketData?.status_id || ''),
        pending_reason: employeeTicketData?.pending_reason || '',
        onhold_reason: employeeTicketData?.onhold_reason || '',
      }}
      validationSchema={validationSchema}
      onSubmit={async values => {
        const ticketData = {
          status_id: Number(values.status_id),
          user_id: userId,
        };

        if (values.status_id === '4') {
          ticketData.onhold_reason =
            values.onhold_reason || 'On-Hold from Employee';
        }

        if (values.status_id === '5') {
          ticketData.pending_reason =
            values.pending_reason || 'Pending from Employee';
        }

        const trackerData = StatusTracker(
          employeeTicketData?.status_tracker,
          values?.status_id === '4'
            ? values.onhold_reason || 'On-Hold from Employee'
            : values?.status_id === '5'
            ? values.pending_reason || 'Pending from Employee'
            : 'Ticket is completed',
          values?.status_id === '4'
            ? 'On-hold'
            : values?.status_id === '5'
            ? 'Pending'
            : 'Done',
          values?.status_id,

          `Employee ${userId}`,
          employeeTicketData?.employee_name,
          employeeTicketData?.employee_phone || '',
        );

        ticketData.status_tracker = trackerData;

        try {
          const response = await axios.put(
            `http://10.0.2.2:5000api/tickets/${employeeTicketData.ticket_id}`,
            { ticketData },
          );
          fetchData();
          onClose();
          Alert.alert('Success', response?.data?.message || 'Ticket updated');
        } catch (err) {
          Alert.alert('Error', err?.response?.data?.error || 'Update failed');
        }
      }}
    >
      {({
        handleChange,
        handleBlur,
        handleSubmit,
        values,
        errors,
        touched,
        setFieldValue,
      }) => (
        <View style={styles.container}>
          <Text style={styles.title}>Status</Text>

          {['6', '4', '5'].map(value => (
            <TouchableOpacity
              key={value}
              style={styles.radioContainer}
              onPress={() => setFieldValue('status_id', value)}
            >
              <View style={styles.radioCircle}>
                {values.status_id === value && (
                  <View style={styles.selectedRb} />
                )}
              </View>
              <Text style={styles.radioLabel}>
                {value === '6' ? 'Done' : value === '4' ? 'On-hold' : 'Pending'}
              </Text>
            </TouchableOpacity>
          ))}

          {employeeTicketData?.status_id === 5 && (
            <TouchableOpacity
              style={styles.radioContainer}
              onPress={() => setFieldValue('status_id', '3')}
            >
              <View style={styles.radioCircle}>
                {values.status_id === '3' && <View style={styles.selectedRb} />}
              </View>
              <Text style={styles.radioLabel}>In-Progress</Text>
            </TouchableOpacity>
          )}

          {values.status_id === '5' && (
            <View>
              <Text style={styles.label}>Pending Reason</Text>
              <TextInput
                style={styles.input}
                value={values.pending_reason}
                onChangeText={handleChange('pending_reason')}
                onBlur={handleBlur('pending_reason')}
                placeholder="Enter pending reason"
              />
              {touched.pending_reason && errors.pending_reason && (
                <Text style={styles.error}>{errors.pending_reason}</Text>
              )}
            </View>
          )}

          {values.status_id === '4' && (
            <View>
              <Text style={styles.label}>On-Hold Reason</Text>
              <TextInput
                style={styles.input}
                value={values.onhold_reason}
                onChangeText={handleChange('onhold_reason')}
                onBlur={handleBlur('onhold_reason')}
                placeholder="Enter on-hold reason"
              />
              {touched.onhold_reason && errors.onhold_reason && (
                <Text style={styles.error}>{errors.onhold_reason}</Text>
              )}
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Update</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Formik>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#008080',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedRb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#008080',
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  label: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
  },
  error: {
    fontSize: 12,
    color: 'red',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  saveButton: {
    backgroundColor: '#008080',
    padding: 12,
    borderRadius: 6,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f39c12',
    padding: 12,
    borderRadius: 6,
    flex: 0.48,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default EditTicket;
