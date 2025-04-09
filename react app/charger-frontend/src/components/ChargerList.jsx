import React, { useState, useEffect } from "react";
import { Button, Card, CardContent, Typography } from "@mui/material";
import AddChargerForm from "./AddChargerForm";

const ChargerList = () => {
  const [chargers, setChargers] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/chargers")
      .then((res) => res.json())
      .then((data) => setChargers(data))
      .catch((error) => console.error("Error fetching chargers:", error));
  }, []);

  return (
    <div>
      <AddChargerForm /> {/* Include form to add new chargers */}
      {chargers.map((charger) => (
        <Card key={charger.id} sx={{ margin: 2 }}>
          <CardContent>
            <Typography variant="h6">{charger.location}</Typography>
            <Typography>
              Status: {charger.available ? "Available" : "Reserved"}
            </Typography>
            <Button variant="contained" color="primary">
              {charger.available ? "Reserve" : "Make Available"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ChargerList;
