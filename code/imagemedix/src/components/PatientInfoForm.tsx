import React from "react";

interface PatientInfoFormProps {
  patientId: string;
  patientName: string;
  onPatientIdChange: (value: string) => void;
  onPatientNameChange: (value: string) => void;
}

const PatientInfoForm: React.FC<PatientInfoFormProps> = ({
  patientId,
  patientName,
  onPatientIdChange,
  onPatientNameChange
}) => {
  return (
    <>
      <div>
        <label htmlFor="patientId" className="block text-sm font-medium text-gray-300 mb-2">
          Patient ID
        </label>
        <input
          type="text"
          id="patientId"
          value={patientId}
          onChange={(e) => onPatientIdChange(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter patient ID"
        />
      </div>

      <div>
        <label htmlFor="patientName" className="block text-sm font-medium text-gray-300 mb-2">
          Patient Name
        </label>
        <input
          type="text"
          id="patientName"
          value={patientName}
          onChange={(e) => onPatientNameChange(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter patient name"
        />
      </div>
    </>
  );
};

export default PatientInfoForm;
