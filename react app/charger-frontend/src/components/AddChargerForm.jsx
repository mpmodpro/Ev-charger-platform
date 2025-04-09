import React, { useState } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";

const AddChargerForm = ({ onAdd }) => {
  const [location, setLocation] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://127.0.0.1:5000/add_charger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, available: true }),
    })
      .then((res) => res.json())
      .then(() => {
        onAdd();
        setLocation("");
      })
      .catch((error) => console.error("Error adding charger:", error));
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h6">Add New Charger</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Charger Location"
          variant="outlined"
          fullWidth
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
        <Button type="submit" variant="contained" color="primary" sx={{ marginTop: 2 }}>
          Add Charger
        </Button>
      </form>
    </Box>
  );
};

export default AddChargerForm;
