import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Send, 
  UploadCloud, 
  RefreshCw, 
  ChevronRight, 
  ChevronLeft, 
  Thermometer, 
  Droplets, 
  Gauge, 
  FileText, 
  AlertTriangle,
  Moon,
  Sun,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary, LoadingFallback } from './ErrorHandlingComponents';
import ReactMarkdown from 'react-markdown';

// Componente de Notificación
const Notification = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
      type === 'error' ? 'bg-red-500' : 'bg-green-500'
    } text-white`}
  >
    <p>{message}</p>
    <button onClick={onClose} className="absolute top-2 right-2">
      <X size={16} />
    </button>
  </motion.div>
);

// Componente de Tarjeta del Dashboard
const DashboardCard = ({ title, content, icon }) => (
  <motion.div 
    className="bg-gradient-to-br from-orange-100 to-orange-200 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
  >
    <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-center text-lg">
      {icon}
      <span className="ml-2">{title}</span>
    </h3>
    {content}
  </motion.div>
);

// Componente de Skeleton Loading
const SkeletonCard = () => (
  <div className="bg-gray-200 h-32 rounded-xl animate-pulse"></div>
);

// Componente principal
const CalibrationDashboardInterface = () => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Welcome to the Calibration Certificate Assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalCertificates: 0,
    expiringCertificates: 0,
    accreditedCertificates: 0,
    equipmentTypes: {},
    environmentalConditions: {
      avgTemperature: '',
      avgHumidity: '',
      avgPressure: ''
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(scrollToBottom, [messages, scrollToBottom]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:5000/api/dashboard');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
        showNotification('Failed to load dashboard data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const sendMessage = async () => {
    if (input.trim()) {
      const newUserMessage = { role: 'human', content: input, timestamp: new Date() };
      setMessages(prevMessages => [...prevMessages, newUserMessage]);
      setInput('');
      setIsLoading(true);
      setIsTyping(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:5000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: input }),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const newAssistantMessage = { role: 'assistant', content: data.response, timestamp: new Date() };
        setMessages(prevMessages => [...prevMessages, newAssistantMessage]);
      } catch (error) {
        console.error('Error sending message:', error);
        setError('Failed to send message. Please try again.');
        showNotification('Failed to send message', 'error');
        const errorMessage = { role: 'assistant', content: "Sorry, an error occurred while processing your request.", timestamp: new Date() };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      } finally {
        setIsLoading(false);
        setIsTyping(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewConversation = () => {
    setMessages([
      { 
        role: 'assistant', 
        content: "Welcome to the Calibration Certificate Assistant. How can I help you today?",
        timestamp: new Date()
      }
    ]);
    showNotification('New conversation started', 'success');
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
    showNotification(`${darkMode ? 'Light' : 'Dark'} mode activated`, 'success');
  };

  const renderCertificateOverview = useMemo(() => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Total Certificates:</span>
        <span className="font-bold text-orange-600">{dashboardData.totalCertificates}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Expiring Soon:</span>
        <span className="font-bold text-orange-600">{dashboardData.expiringCertificates}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Accredited:</span>
        <span className="font-bold text-orange-600">{dashboardData.accreditedCertificates}</span>
      </div>
    </div>
  ), [dashboardData]);

  const renderEquipmentTypes = useMemo(() => (
    <div className="space-y-3">
      {Object.entries(dashboardData.equipmentTypes).map(([type, count]) => (
        <div key={type} className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{type}:</span>
          <span className="font-bold text-orange-600">{count}</span>
        </div>
      ))}
    </div>
  ), [dashboardData.equipmentTypes]);

  const renderEnvironmentalConditions = useMemo(() => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 flex items-center">
          <Thermometer size={16} className="text-orange-500 mr-2" />
          Temperature:
        </span>
        <span className="font-bold text-orange-600">{dashboardData.environmentalConditions.avgTemperature}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 flex items-center">
          <Droplets size={16} className="text-orange-500 mr-2" />
          Humidity:
        </span>
        <span className="font-bold text-orange-600">{dashboardData.environmentalConditions.avgHumidity}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 flex items-center">
          <Gauge size={16} className="text-orange-500 mr-2" />
          Pressure:
        </span>
        <span className="font-bold text-orange-600">{dashboardData.environmentalConditions.avgPressure}</span>
      </div>
    </div>
  ), [dashboardData.environmentalConditions]);

  return (
    <ErrorBoundary>
      <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-orange-50 text-gray-800'} transition-colors duration-300`}>
        {/* Sidebar Dashboard */}
        <motion.div 
          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg transition-all duration-300 overflow-hidden ${sidebarOpen ? 'block' : 'hidden'} md:block`}
          initial={false}
          animate={{ 
            width: sidebarOpen ? 320 : 0,
            opacity: sidebarOpen ? 1 : 0
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="p-6 space-y-6">
            <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'} text-center`}>Calibration Dashboard</h2>
            
            <AnimatePresence>
              {isLoading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : error ? (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4"
                  role="alert"
                >
                  <p className="font-bold">Error</p>
                  <p>{error}</p>
                </motion.div>
              ) : (
                <>
                  <DashboardCard
                    title="Certificates Overview"
                    content={renderCertificateOverview}
                    icon={<FileText size={20} className="text-orange-500" />}
                  />
                  
                  <DashboardCard
                    title="Equipment Types"
                    content={renderEquipmentTypes}
                    icon={<Gauge size={20} className="text-orange-500" />}
                  />
                  
                  <DashboardCard
                    title="Avg. Environmental Conditions"
                    content={renderEnvironmentalConditions}
                    icon={<Thermometer size={20} className="text-orange-500" />}
                  />
                </>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-orange-400 to-orange-500'} p-4 flex justify-between items-center`}>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-orange-500'} transition-colors duration-300`}
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
            </motion.button>
            <h1 className="text-2xl font-bold text-white text-center flex-grow">Calibration Certificate Assistant</h1>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-orange-500'} transition-colors duration-300`}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>
          </div>

          {/* Messages Area */}
          <div className={`flex-1 overflow-auto p-6 space-y-4 ${darkMode ? 'bg-gray-800' : 'bg-orange-50'}`}>
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div 
                key={index} 
                className={`flex items-start ${message.role === 'human' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {message.role === 'assistant' && (
                  <img src="/images/LogoPhoenix.png" alt="Assistant Logo" className="w-13 h-7 mr-4 mt-2" />
                )}
                <div className={`max-w-2xl p-4 rounded-lg shadow-md ${
                  message.role === 'human' 
                    ? `${darkMode ? 'bg-orange-700' : 'bg-gradient-to-r from-orange-500 to-orange-600'} text-white ml-auto rounded-br-none` 
                    : `${darkMode ? 'bg-gray-700' : 'bg-white'} ${darkMode ? 'text-white' : 'text-gray-800'} rounded-bl-none`
                }`}>
                  <ReactMarkdown className="text-sm">{message.content}</ReactMarkdown>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                  {message.certificate && (
                    <div className={`mt-4 ${darkMode ? 'bg-gray-600' : 'bg-orange-100'} p-4 rounded-md`}>
                      <h4 className={`font-semibold ${darkMode ? 'text-orange-300' : 'text-orange-800'} mb-2`}>Certificate Details</h4>
                      <div className="space-y-2">
                        <p><span className="font-medium">Certificate No:</span> {message.certificate.certNo}</p>
                        <p><span className="font-medium">Equipment Type:</span> {message.certificate.equipmentType}</p>
                        <p><span className="font-medium">Manufacturer:</span> {message.certificate.manufacturer}</p>
                        <p><span className="font-medium">Model:</span> {message.certificate.model}</p>
                        <p><span className="font-medium">Calibration Date:</span> {message.certificate.calibrationDate}</p>
                        <p><span className="font-medium">Due Date:</span> {message.certificate.dueDate}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
                ))}
              </AnimatePresence>
              {isTyping && (
                <div className="flex items-center space-x-2 text-gray-400">
                  <div className="w-2 h-2 rounded-full animate-bounce bg-gray-400"></div>
                  <div className="w-2 h-2 rounded-full animate-bounce bg-gray-400" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce bg-gray-400" style={{animationDelay: '0.4s'}}></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
  
            {/* Input Area */}
            <div className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border-t p-4`}>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about a specific certificate or calibration data..."
                  className={`flex-1 p-3 border ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-800 border-orange-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300`}
                  disabled={isLoading}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={isLoading}
                  className={`${darkMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gradient-to-r from-orange-500 to-orange-600'} text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Send size={24} />
                </motion.button>
              </div>
              <div className="mt-3 flex justify-between items-center text-sm text-gray-500">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  onClick={startNewConversation}
                  className={`flex items-center space-x-1 ${darkMode ? 'hover:text-orange-400' : 'hover:text-orange-600'} transition-colors duration-300`}
                >
                  <RefreshCw size={16} />
                  <span>New conversation</span>
                </motion.button>
                <div className="flex items-center space-x-1 text-orange-600">
                  <AlertTriangle size={16} />
                  <span>AI-generated responses may require verification</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <AnimatePresence>
          {notification && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          )}
        </AnimatePresence>
      </ErrorBoundary>
    );
  };
  
  export default CalibrationDashboardInterface;