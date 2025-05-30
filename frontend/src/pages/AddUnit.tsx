import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { useApiService } from "@/hooks/useApiService";

const AddUnitPage: React.FC = () => {
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const { api } = useApiService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await api.addUnit({ name, abbreviation });
      setSuccess("Unit added successfully!");
      setName("");
      setAbbreviation("");
      setTimeout(() => navigate(-1), 1200);
    } catch (err: any) {
      setError(
        err.message ||
        "Failed to add unit"
      );
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Add New Unit</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Unit Name</label>
          <Input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. gram"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Abbreviation</label>
          <Input
            type="text"
            required
            value={abbreviation}
            onChange={e => setAbbreviation(e.target.value)}
            placeholder="e.g. g"
          />
        </div>
        <Button type="submit" className="w-full">Add Unit</Button>
      </form>
      {success && <div className="text-green-600 mt-4">{success}</div>}
      {error && <div className="text-red-600 mt-4">{error}</div>}
    </div>
  );
};

export default AddUnitPage;