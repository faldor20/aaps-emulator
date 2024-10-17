import { generate } from './iob/index';
import {describe, it,expect} from 'vitest'

describe('IOB Calculation Tests', () => {
  it('should calculate IOB correctly with dummy data', () => {
    // Dummy input data
    const inputs = {
      clock: new Date('2023-04-15T12:00:00Z').toISOString(),
      profile: {
        dia: 5,
        peak: 75,
        useCustomPeakTime: false,
        insulinPeakTime: 75,
        curve: 'ultra-rapid',
        basalprofile: [
          {
            minutes: 0,
            rate: 1.0
          },
       
        ]
      },
      // ... other input properties
    };

    // Dummy treatments
    const treatments = [
      {
        _type: 'Bolus',
        insulin: 3,
        date: new Date('2023-04-15T11:30:00Z'),
        created_at: new Date('2023-04-15T11:30:00Z')
      },
      {
        _type: 'TempBasal',
        temp: 'absolute',
        rate: 2,
        duration: 3,
        timestamp: new Date('2023-04-15T11:45:00Z'),
        started_at: new Date('2023-04-15T11:45:00Z'),
        date: new Date('2023-04-15T11:45:00Z').getTime()
      }
    ];

    // Call the generate function
    const result = generate(inputs, false, treatments);

    // Assertions
    expect(result).to.be.an('array');
    console.log("result", result)
    expect(result.length).to.be.greaterThan(0);
    expect(result[0]).to.have.property('iob');
    expect(result[0]).to.have.property('activity');
    expect(result[0]).to.have.property('lastBolusTime');
    expect(result[0]).to.have.property('lastTemp');
    
    // Add more specific assertions based on expected values
    // For example:
    // expect(result[0].iob).to.be.closeTo(2.8, 0.1);
  });
});

describe('IOB Calculation Tests', () => {
  // ... previous test ...

  it('should calculate IOB correctly with history data', () => {
    // Dummy input data with history
    const inputs = {
      clock: new Date('2023-04-15T12:00:00Z').toISOString(),
      profile: {
        dia: 5,
        peak: 75,
        useCustomPeakTime: false,
        insulinPeakTime: 75,
        curve: 'rapid-acting',
        basalprofile: [
          {
            minutes: 0,
            rate: 1.0
          },
        ]
      },
      history: [
    
        {
          _type: 'Bolus',
          amount: 3,
          started_at: new Date('2023-04-15T11:45:00Z'),
          timestamp: new Date('2023-04-15T11:30:00Z').toISOString()
        },
        {
          _type: 'TempBasal',
          rate: 0.8,
          duration: 120,
          started_at: new Date('2023-04-15T11:45:00Z'),
          timestamp: new Date('2023-04-15T11:45:00Z').toISOString()
        },
        {
          _type: 'TempBasal',
          rate: 1.2,
          duration: 60,
          started_at: new Date('2023-04-15T13:45:00Z'),
          timestamp: new Date('2023-04-15T13:45:00Z').toISOString()
        },

      ]
    };

    // Call the generate function without providing treatments
    const result = generate(inputs, false,null);

    // Assertions
    console.log("result", result);
    expect(result).to.be.an('array');
    expect(result.length).to.be.greaterThan(0);
    expect(result[0]).to.have.property('iob');
    expect(result[0]).to.have.property('activity');
    expect(result[0]).to.have.property('lastBolusTime');
    expect(result[0]).to.have.property('lastTemp');
    
    // Add more specific assertions based on expected values
    // For example:
    // expect(result[0].iob).to.be.closeTo(2.8, 0.1);

    // Check if the function correctly derived treatments from history
    expect(result[0].lastBolusTime).to.equal(new Date('2023-04-15T11:30:00Z').getTime());
   
  });
});

describe('IOB Calculation Tests', () => {
  it('should caluclate the IOB difference correctly', () => {
    const inputs = {
      clock: new Date('2023-04-15T12:00:00Z').toISOString(),
      profile: {
        dia: 5,
        peak: 75,
        useCustomPeakTime: false,
        insulinPeakTime: 75,
        curve: 'rapid-acting',
        basalprofile: [
          {
            minutes: 0,
            rate: 1.0
          },
        ]
      },
      history: [
    
        {
          _type: 'Bolus',
          amount: 3,
          started_at: new Date('2023-04-15T11:45:00Z'),
          timestamp: new Date('2023-04-15T11:30:00Z').toISOString()
        },
        {
          _type: 'TempBasal',
          rate: 0.8,
          duration: 120,
          started_at: new Date('2023-04-15T11:45:00Z'),
          timestamp: new Date('2023-04-15T11:45:00Z').toISOString()
        },
        {
          _type: 'TempBasal',
          rate: 1.2,
          duration: 60,
          started_at: new Date('2023-04-15T11:50:00Z'),
          timestamp: new Date('2023-04-15T11:50:00Z').toISOString()
        },

      ]
    };


   
    
    // Call the generate function without providing treatments
    const result = generate(inputs, false,null);
    const original_history=JSON.parse(JSON.stringify(inputs.history));
    original_history[0].amount=2;
    original_history[1].rate=0.7;
    original_history[2].rate=1;
    const original_inputs=JSON.parse(JSON.stringify(inputs));
    original_inputs.history=original_history;
    const og_result = generate(original_inputs, false,null);
    console.log("result", result[1]);
    expect(result[1].iob).to.greaterThan(og_result[1].iob);

    console.log(result[3].iob, og_result[3].iob,"difference:", result[3].iob-og_result[3].iob);


 const differenceHistory= original_history.map((item,index)=>{
  if (item._type==="Bolus"){
    return {
      ...item,
      amount: item.amount-inputs.history[index].amount
    }
  }
  else if (item._type==="TempBasal"){
    return {
      ...item,
      rate: item.rate-inputs.history[index].rate
    }
  }
  return item;
 });

    const difference_inputs=JSON.parse(JSON.stringify(inputs));
    difference_inputs.history=differenceHistory;  
    const difference_result = generate(difference_inputs, false,null);
    console.log("difference_iob", difference_result[3].iob);
    
    //This ensures that subtracting before running the iob calucluation is equivelent to doing it after
    expect(-difference_result[3].iob).to.approximately(result[3].iob-og_result[3].iob,0.0001);
    expect(-difference_result[8].iob).to.approximately(result[8].iob-og_result[8].iob,0.0001);
  }); 
});

describe('IOB Calculation Tests', () => {
  it('should calculate IOB with a single bolus', () => {
   const treatments=[
    
    
      {
        _type: "Bolus",
        insulin: 0.05,
        started_at: new Date('2024-10-11T10:42:49.774Z'),
        date: new Date('2024-10-11T10:42:49.774Z')
      },
      {
        _type: "Bolus",
        insulin: 0.5,
        started_at: new Date('2024-10-11T10:45:49.774Z'),
        date: new Date('2024-10-11T10:45:49.774Z')
      }
    
   ];
   const history=[
    
    {
      _type: "Bolus",
      amount: 0.5,
      started_at: new Date('2024-10-11T10:45:49.774Z'),
      date: new Date('2024-10-11T10:45:49.774Z'),
      timestamp: new Date('2024-10-11T10:45:49.774Z'),
      created_at: new Date('2024-10-11T10:45:49.774Z')
    },
    {
      _type: "Bolus",
      amount: 0.05,
      started_at: new Date('2024-10-11T10:42:49.774Z'),
      date: new Date('2024-10-11T10:42:49.774Z'),
      created_at: new Date('2024-10-11T10:42:49.774Z'),
      timestamp: new Date('2024-10-11T10:42:49.774Z')
    },

  
 ];
    const inputs = {
      clock: "2024-10-11T10:50:52.137Z",
   
        profile: {
          dia: 9,
          peak: 55,
          useCustomPeakTime: false,
          insulinPeakTime: 55,
          curve: "ultra-rapid",
          basalprofile: [
            {
              minutes: 0,
              rate: 1.2
            }
          ]
        },
        history: history,
      
    };
    const result = generate(inputs, false, null);
console.log("result", result[0]);
    expect(result.length).to.be.greaterThan(0);
    expect(result[0].iob).to.be.greaterThan(0.07);
    expect(result[0]).to.have.property('iob');
    expect(result[0]).to.have.property('activity');
    expect(result[0]).to.have.property('lastBolusTime');
    expect(result[0]).to.have.property('lastTemp');

  });

});

