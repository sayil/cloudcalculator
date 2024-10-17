import React, { useState, useEffect } from 'react';

interface PricingCalculatorProps {
  // You can add any props here if needed
}

interface ComputeSize {
  name: string;
  memory: number;
  cpu: string;
  price: number;
  minDiskSize: number;
  maxDiskSize: number;
  minIops: number;
  maxIops: number;
  defaultDiskSize: number;
  defaultIops: number;
  burstIops: number;
  burstEnabled: boolean;
}

interface StorageType {
  name: string;
  key: string;
  description: string;
}

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  size: ComputeSize;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, size }) => {
  if (!isOpen) return null;

  const minMonthlyPrice = (size.price * 24 * 30).toFixed(2);
  const maxMonthlyPrice = (size.price * 24 * 31).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-2">{size.name} Instance Details</h3>
        <p className="mb-4">Monthly Price Range: ${minMonthlyPrice} - ${maxMonthlyPrice}</p>
        <button
          onClick={onClose}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const PricingCalculator: React.FC<PricingCalculatorProps> = () => {
  const [diskSize, setDiskSize] = useState<number>(8);
  const [iopsInput, setIopsInput] = useState<string>('3000');
  const [iops, setIops] = useState<number>(3000);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [selectedComputeSize, setSelectedComputeSize] = useState<string>('Micro');
  const [storageType, setStorageType] = useState<string>('gp3');
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedInfoSize, setSelectedInfoSize] = useState<ComputeSize | null>(null);
  const [diskSizeWarning, setDiskSizeWarning] = useState<string>('');
  const [iopsWarning, setIopsWarning] = useState<string>('');
  const [usedSpace, _setUsedSpace] = useState<number>(0.59); // GB



  const computeSizes: ComputeSize[] = [
    { name: 'Micro', memory: 1, cpu: '2-core ARM CPU (Shared)', price: 0.01344, minDiskSize: 8, maxDiskSize: 1000, minIops: 100, maxIops: 3000, defaultDiskSize: 8, defaultIops: 500, burstIops: 11800, burstEnabled: true},
    { name: 'Small', memory: 2, cpu: '2-core ARM CPU (Shared)', price: 0.0206, minDiskSize: 8, maxDiskSize: 2000, minIops: 100, maxIops: 5000, defaultDiskSize: 8, defaultIops: 1000, burstIops: 11800, burstEnabled: true },
    { name: 'Medium', memory: 4, cpu: '2-core ARM CPU (Shared)', price: 0.0822, minDiskSize: 8, maxDiskSize: 4000, minIops: 100, maxIops: 10000, defaultDiskSize: 8, defaultIops: 2000, burstIops: 11800, burstEnabled: true },
    { name: 'Large', memory: 8, cpu: '2-core ARM CPU (Dedicated)', price: 0.1517, minDiskSize: 8, maxDiskSize: 8000, minIops: 100, maxIops: 20000, defaultDiskSize: 8, defaultIops: 3600, burstIops: 20000, burstEnabled: true },
    { name: 'XL', memory: 16, cpu: '4-core ARM CPU (Dedicated)', price: 0.2877, minDiskSize: 8, maxDiskSize: 16000, minIops: 100, maxIops: 32000, defaultDiskSize: 8, defaultIops: 6000, burstIops: 20000, burstEnabled: true },
    { name: '2XL', memory: 32, cpu: '8-core ARM CPU (Dedicated)', price: 0.562, minDiskSize: 8, maxDiskSize: 32000, minIops: 100, maxIops: 64000, defaultDiskSize: 12, defaultIops: 12000, burstIops: 20000, burstEnabled: true },
    { name: '4XL', memory: 64, cpu: '16-core ARM CPU (Dedicated)', price: 1.32, minDiskSize: 8, maxDiskSize: 64000, minIops: 100, maxIops: 64000, defaultDiskSize: 20, defaultIops: 20000, burstIops: 20000, burstEnabled: false },
    { name: '8XL', memory: 128, cpu: '32-core ARM CPU (Dedicated)', price: 2.562, minDiskSize: 8, maxDiskSize: 64000, minIops: 100, maxIops: 64000, defaultDiskSize: 40, defaultIops: 40000, burstIops: 40000, burstEnabled: false },
    { name: '12XL', memory: 192, cpu: '48-core ARM CPU (Dedicated)', price: 3.836, minDiskSize: 8, maxDiskSize: 64000, minIops: 100, maxIops: 64000, defaultDiskSize: 50, defaultIops: 50000, burstIops: 50000, burstEnabled: false },
    { name: '16XL', memory: 256, cpu: '64-core ARM CPU (Dedicated)', price: 5.12, minDiskSize: 8, maxDiskSize: 64000, minIops: 100, maxIops: 64000, defaultDiskSize: 80, defaultIops: 80000, burstIops: 80000, burstEnabled: false },
  ];

  const storageTypes: StorageType[] = [
    { name: 'General Purpose SSD', key: 'gp3', description: 'gp3 provides a balance between price and performance' },
    { name: 'Provisioned IOPS SSD', key: 'io2', description: 'io2 offers high IOPS for mission-critical applications.' },
  ];

  useEffect(() => {
    const selectedSize = computeSizes.find(size => size.name === selectedComputeSize);
    if (selectedSize) {
      setDiskSize(prevDiskSize => {
        const newDiskSize = Math.max(selectedSize.minDiskSize, Math.min(prevDiskSize, selectedSize.maxDiskSize));
        setDiskSizeWarning(''); // Clear disk size warning
        return newDiskSize;
      });
      
      // Update IOPS based on storage type and clear warning
      if (storageType === 'gp3') {
        setIops(3000);
      } else {
        setIops(selectedSize.defaultIops);
      }
      setIopsWarning('');
    }
    calculateTotalCost();
  }, [selectedComputeSize, storageType]);

  const calculateTotalCost = () => {
    const selectedSize = computeSizes.find(size => size.name === selectedComputeSize);
    const instanceCost = selectedSize ? selectedSize.price * 24 * 30 : 0; // Monthly cost
    
    // Storage cost calculation
    let storageCost = 0;
    let iopsCost = 0;
    let throughputCost = 0;

    const chargeableDiskSize = Math.max(0, diskSize - 8); // First 8 GB are free

    if (storageType === 'gp3') {
      storageCost = chargeableDiskSize * 0.08; // $0.08/GB-month
      if (iops > 3000) {
        iopsCost = (iops - 3000) * 0.005; // $0.005/provisioned IOPS-month over 3,000
      }
      // Assuming a default throughput of 125 MB/s, adjust if you have a throughput input
      const throughput = 125; // MB/s
      if (throughput > 125) {
        throughputCost = (throughput - 125) * 0.040; // $0.040/provisioned MB/s-month over 125
      }
    } else if (storageType === 'io2') {
      storageCost = chargeableDiskSize * 0.125; // $0.125/GB-month
      if (iops <= 32000) {
        iopsCost = iops * 0.065;
      } else if (iops <= 64000) {
        iopsCost = 32000 * 0.065 + (iops - 32000) * 0.046;
      } else {
        iopsCost = 32000 * 0.065 + 32000 * 0.046 + (iops - 64000) * 0.032;
      }
    }

    const total = instanceCost + storageCost + iopsCost + throughputCost;
    setTotalCost(parseFloat(total.toFixed(2)));
  };


  const handleDiskSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const numValue = newValue === '' ? 0 : Number(newValue);
    setDiskSize(numValue);
    
    const selectedSize = computeSizes.find(size => size.name === selectedComputeSize);
    if (selectedSize) {
      if (numValue < selectedSize.minDiskSize) {
        setDiskSizeWarning(`Minimum disk size is ${selectedSize.minDiskSize} GB`);
      } else if (numValue > selectedSize.maxDiskSize) {
        setDiskSizeWarning(`Maximum disk size is ${selectedSize.maxDiskSize} GB for ${selectedSize.name} instances`);
      } else {
        setDiskSizeWarning('');
      }
    }
    calculateTotalCost();
  };

  const getMaxIops = () => {
    if (storageType === 'gp3') {
      return Math.max(3000, Math.min(500 * diskSize, 16000));
    } else { // io2
      return Math.min(1000 * diskSize, 256000);
    }
  };

  const handleIopsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setIopsInput(newValue);
    
    if (newValue !== '') {
      const numValue = Number(newValue);
      setIops(numValue);
      
      const minIops = storageType === 'gp3' ? 3000 : 100;
      const maxIops = getMaxIops();
      if (numValue < minIops) {
        setIopsWarning(`Minimum IOPS is ${minIops} for ${storageType} storage`);
      } else if (numValue > maxIops) {
        setIopsWarning(`Maximum IOPS is ${maxIops} for ${diskSize} GB of ${storageType} storage`);
      } else {
        setIopsWarning('');
      }
    } else {
      setIopsWarning('');
    }
    
    calculateTotalCost();
  };

  const handleComputeSizeClick = (sizeName: string) => {
    const selectedSize = computeSizes.find(size => size.name === sizeName);
    if (selectedSize) {
      setSelectedComputeSize(sizeName);
      setDiskSize(selectedSize.defaultDiskSize);
      
      // Set IOPS based on storage type
      if (storageType === 'io2') {
        setIops(selectedSize.defaultIops);
      } else {
        setIops(3000); // Default for gp3
      }
      
      // Recalculate total cost after updating values
      calculateTotalCost();
    }
  };

  const handleStorageTypeChange = (type: string) => {
    setStorageType(type);
    const selectedSize = computeSizes.find(size => size.name === selectedComputeSize);
    
    if (type === 'gp3') {
      setIops(3000);
    } else if (type === 'io2' && selectedSize) {
      setIops(selectedSize.defaultIops);
    }
    
    calculateTotalCost();
  };

  //const selectedSize = computeSizes.find(size => size.name === selectedComputeSize);
 /*
  const minDiskSize = 8;
  const maxDiskSize = 64000;

  const getSliderBackground = () => {
    if (!selectedSize) return '';
    const minPercent = ((selectedSize.minDiskSize - minDiskSize) / (maxDiskSize - minDiskSize)) * 100;
    const maxPercent = ((selectedSize.maxDiskSize - minDiskSize) / (maxDiskSize - minDiskSize)) * 100;
    const valuePercent = ((diskSize - minDiskSize) / (maxDiskSize - minDiskSize)) * 100;

    return `linear-gradient(to right, 
      #ff0000 0%, #ff0000 ${minPercent}%, 
      #3b82f6 ${minPercent}%, #3b82f6 ${valuePercent}%, 
      #93c5fd ${valuePercent}%, #93c5fd ${maxPercent}%, 
      #ff0000 ${maxPercent}%, #ff0000 100%)`;
  };

  const getIopsSliderBackground = () => {
    const minIops = storageType === 'gp3' ? 3000 : 100;
    const maxIops = getMaxIops();
    const totalRange = 256000 - 100; // Use 100 as the absolute minimum for the slider
    const minPercent = ((minIops - 100) / totalRange) * 100;
    const maxPercent = ((maxIops - 100) / totalRange) * 100;
    const valuePercent = ((iops - 100) / totalRange) * 100;

    return `linear-gradient(to right, 
      #ff0000 0%, #ff0000 ${minPercent}%, 
      #3b82f6 ${minPercent}%, #3b82f6 ${valuePercent}%, 
      #93c5fd ${valuePercent}%, #93c5fd ${maxPercent}%, 
      #ff0000 ${maxPercent}%, #ff0000 100%)`;
  };
  */

  useEffect(() => {
    const maxIops = getMaxIops();
    setIops(prevIops => Math.min(prevIops, maxIops));
  }, [diskSize, storageType]);

  useEffect(() => {
    const selectedSize = computeSizes.find(size => size.name === selectedComputeSize);
    if (selectedSize) {
      setDiskSize(selectedSize.defaultDiskSize);
      
      if (storageType === 'io2') {
        setIops(selectedSize.defaultIops);
      } else {
        setIops(3000); // Default for gp3
      }
    }
    calculateTotalCost();
  }, [selectedComputeSize, storageType]);

  const handleInfoClick = (e: React.MouseEvent, size: ComputeSize) => {
    e.stopPropagation();
    setSelectedInfoSize(size);
    setInfoModalOpen(true);
  };

  const defaultDiskSize = 8; // Define the default disk size

  return (
    <div className="pricing-calculator mt-10 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold p-6 border-b text-gray-800">IOPS Pricing Calculator</h2>
      
      {/* Compute Size Section */}
      <section className="p-6 border-b">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Compute Size</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {computeSizes.map((size) => (
            <div
              key={size.name}
              onClick={() => handleComputeSizeClick(size.name)}
              className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                selectedComputeSize === size.name
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sm">{size.name}</span>
                {selectedComputeSize === size.name && (
                  <span className="px-1 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">Current</span>
                )}
              </div>
              <div className="text-xs text-gray-600 mb-1">
                <p>{size.memory} GB RAM</p>
                <p>{size.cpu.split(' ')[0]}</p>
                <p>{size.defaultDiskSize} GB Disk (default)</p>
                <p>{size.defaultIops} IOPS (default)</p>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-800">${size.price.toFixed(5)}/h</span>
                <div className="flex items-center">
                  {size.burstEnabled && (
                    <div className="relative group mr-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-48 text-center">
                        Burst enabled: Can reach up to {size.burstIops} IOPS during burst periods.
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800"
                    onClick={(e) => handleInfoClick(e, size)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Storage Type Section */}
      <section className="p-6 border-b">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Storage type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {storageTypes.map((type) => (
            <div
              key={type.key}
              onClick={() => handleStorageTypeChange(type.key)}
              className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                storageType === type.key
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{type.name}</span>
                <span className="px-2 py-1 text-xs bg-gray-200 rounded-full">{type.key}</span>
              </div>
              <p className="text-sm text-gray-600">{type.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disk Size Section */}
      <section className="p-6 border-b">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Disk Size</h3>
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center">
            <input
              type="number"
              id="diskSize"
              value={diskSize || ''}
              onChange={handleDiskSizeChange}
              className="w-24 p-2 border rounded-l-lg text-right"
            />
            <span className="bg-gray-100 border border-l-0 rounded-r-lg px-3 py-2 text-gray-600">GB</span>
          </div>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
            ${(Math.max(0, diskSize - 8) * (storageType === 'gp3' ? 0.08 : 0.125)).toFixed(2)} / month
          </span>
        </div>
        {diskSizeWarning && <p className="text-yellow-500 text-sm mb-2">{diskSizeWarning}</p>}
        <p className="text-sm text-gray-600 mb-2">
          First 8 GB are free. Additional storage is charged at ${storageType === 'gp3' ? '0.08' : '0.125'}/GB-month.
        </p>
        <p className="text-sm text-gray-600 mb-2">
          {usedSpace.toFixed(2)} GB used of {diskSize.toFixed(2)} GB (8 GB-HR free per hour)
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${(usedSpace / (diskSize as number)) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-4">
          <span>Used Space</span>
          <span>Available space</span>
        </div>
        
        {/* Autoscaling button - only visible when disk size is default (8 GB) */}
        {diskSize === defaultDiskSize && (
          <div className="flex justify-end mb-4">
            <div className="relative group">
              <button className="px-3 py-1 bg-gray-200 rounded text-sm text-gray-600 hover:bg-gray-300 transition-colors">
                Autoscaling
              </button>
              <div className="absolute bottom-full right-0 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 invisible group-hover:visible transition-all duration-200 opacity-0 group-hover:opacity-100">
                <p className="text-sm text-gray-600 mb-2">
                  Supabase expands your disk storage automatically when the database reached 90% of the disk size.
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  However, any disk modifications, including auto-scaling, can only take place once every 6 hours.
                </p>
                <p className="text-sm text-gray-600">
                  If within those 6 hours you reach 95% of the disk space, your project <span className="text-red-500 font-semibold">will enter read-only mode</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500">
          Note: Disk Size refers to the total space your project occupies on disk, including the database itself
          (currently {diskSize.toFixed(2)} GB), additional files like the write-ahead log (WAL), and other internal resources.
        </p>
      </section>

      {/* IOPS Section */}
      <section className="p-6 border-b">
        <h3 className="text-lg font-medium text-gray-700 mb-2">IOPS</h3>
        <p className="text-sm text-gray-500 mb-4">
          Input/output operations per second. Higher IOPS is suitable for applications requiring high throughput.
        </p>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="number"
              id="iops"
              value={iopsInput}
              onChange={handleIopsChange}
              className="w-24 p-2 border rounded-l-lg text-right"
            />
            <span className="bg-gray-100 border border-l-0 rounded-r-lg px-3 py-2 text-gray-600">IOPS</span>
          </div>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
            ${((iops as number) * 0.065).toFixed(2)} / month
          </span>
        </div>
        {iopsWarning && <p className="text-yellow-500 text-sm mt-2">{iopsWarning}</p>}
        <p className="text-sm text-gray-600 mt-2">
          IOPS must be between {storageType === 'gp3' ? 3000 : 100} and {getMaxIops()} based on your disk size.{' '}
          <span className="text-blue-600 cursor-pointer">ⓘ</span>
        </p>
      </section>

      {/* Total Cost Section */}
      <section className="p-6 border-b">
        <div className="bg-blue-50 rounded-md p-4">
          <strong className="text-xl text-blue-700">Total Monthly Cost: ${totalCost} per replica</strong>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          First 8 GB of storage are free. {storageType === 'gp3'
            ? 'Additional gp3 storage is billed at $0.08/GB-month. Additional charges apply for IOPS over 3,000 and throughput over 125 MB/s.'
            : 'Additional io2 storage is billed at $0.125/GB-month with variable IOPS pricing based on provisioned IOPS.'}
        </p>
      </section>

      {/* Action Buttons Section 
      <section className="p-6 flex justify-end space-x-4">
        <span className="px-3 py-2 bg-gray-100 rounded text-sm text-gray-600">
          1 change to review
        </span>
        <button className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Review changes
        </button>
      </section>
      */}
      
      {selectedInfoSize && (
        <InfoModal
          isOpen={infoModalOpen}
          onClose={() => setInfoModalOpen(false)}
          size={selectedInfoSize}
        />
      )}
    </div>
  );
};

export default PricingCalculator;