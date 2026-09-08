import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Paperclip, Clock, Upload, Bold, Italic, Underline, AlignLeft, List, Link as LinkIcon, RotateCcw, RotateCw, Type, X } from 'lucide-react';
import { scheduleEmail } from '../api';
import toast from 'react-hot-toast';

export default function Compose() {
  const navigate = useNavigate();
  
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [delay, setDelay] = useState('');
  const [hourlyLimit, setHourlyLimit] = useState('');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddRecipient = () => {
    const input = recipientInput.trim();
    if (input && !recipients.includes(input)) {
      if (/^\S+@\S+\.\S+$/.test(input)) {
        setRecipients([...recipients, input]);
        setRecipientInput('');
      } else {
        toast.error('Invalid email address');
      }
    }
  };

  const handleRecipientKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddRecipient();
    } else if (e.key === 'Backspace' && recipientInput === '' && recipients.length > 0) {
      setRecipients(recipients.slice(0, -1));
    }
  };

  const removeRecipient = (emailToRemove: string) => {
    setRecipients(recipients.filter(r => r !== emailToRemove));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    import('papaparse').then((Papa) => {
      Papa.default.parse(file, {
        complete: (results) => {
          const rawEmails: string[] = [];
          results.data.forEach((row: any) => {
            const values = Object.values(row);
            values.forEach((val: any) => {
              if (typeof val === 'string' && val.includes('@')) {
                rawEmails.push(val.trim());
              }
            });
          });

          const unique = [...new Set(rawEmails)];
          const valid: string[] = [];
          const invalid: string[] = [];

          const emailRegex = /^\S+@\S+\.\S+$/;
          unique.forEach(email => {
            if (emailRegex.test(email)) valid.push(email);
            else invalid.push(email);
          });

          const mergedValid = [...new Set([...recipients, ...valid])];
          setRecipients(mergedValid);
          
          
          if (invalid.length > 0) {
            toast.error(`Found ${invalid.length} invalid addresses`);
          }
          toast.success(`Loaded ${valid.length} valid addresses`);
        },
        header: true,
        skipEmptyLines: true,
      });
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (recipientInput.trim()) {
      handleAddRecipient();
    }

    if (recipients.length === 0 && !recipientInput.trim()) {
      toast.error('Please add at least one recipient');
      return;
    }

    if (!scheduledAt) {
      toast.error('Please select a schedule time by clicking Send Later');
      return;
    }
    
    setLoading(true);
    try {
      const emailsToSchedule = recipients.length > 0 ? recipients : [recipientInput.trim()];
      
      // We now send the array directly to the backend
      const res = await scheduleEmail({
        recipients: emailsToSchedule,
        subject,
        body,
        scheduledAt: new Date(scheduledAt).toISOString(),
        delay,
        hourlyLimit
      });

      toast.success(res.message || `Successfully scheduled ${emailsToSchedule.length} email(s)!`);
      navigate('/scheduled');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to schedule emails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-medium text-gray-900">Compose New Email</h2>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-gray-600">
            <Paperclip className="w-5 h-5" />
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            <Clock className="w-5 h-5" />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="px-4 py-2 bg-white border border-[#0fa44a] text-[#0fa44a] rounded-full text-sm font-medium hover:bg-gray-50 transition"
            >
              Send Later
            </button>
            
            {/* Popover for Date Picker */}
            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4">
                <h3 className="text-sm font-semibold mb-3">Send Later</h3>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-4 outline-none focus:border-[#0fa44a]"
                />
                <div className="flex justify-end space-x-2">
                  <button onClick={() => setShowDatePicker(false)} className="px-3 py-1.5 text-sm font-medium text-gray-600">Cancel</button>
                  <button onClick={handleSubmit} disabled={loading} className="px-4 py-1.5 bg-white border border-[#0fa44a] text-[#0fa44a] rounded-full text-sm font-medium hover:bg-gray-50">
                    {loading ? 'Scheduling...' : 'Done'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Area */}
      <div className="flex-1 overflow-y-auto px-12 py-8 max-w-4xl mx-auto w-full">
        <form className="space-y-6">
          {/* From */}
          <div className="flex items-center border-b border-gray-100 pb-2">
            <label className="w-20 text-sm font-medium text-gray-700">From</label>
            <div className="bg-gray-100 text-gray-800 text-sm py-1.5 px-3 rounded-md flex items-center">
              oliver.brown@domain.io
            </div>
          </div>

          {/* To */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex flex-wrap items-center flex-1 gap-2">
              <label className="w-20 text-sm font-medium text-gray-700">To</label>
              
              {/* Render Pills (Limit to 20 for performance) */}
              {recipients.slice(0, 20).map((rec, idx) => (
                <span key={idx} className="px-3 py-1 bg-[#e6f6ec] text-[#0fa44a] rounded-full text-xs font-medium border border-[#0fa44a] flex items-center">
                  {rec}
                  <button type="button" onClick={() => removeRecipient(rec)} className="ml-1 text-[#0fa44a] hover:text-[#0a7a35]">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {recipients.length > 20 && (
                <span className="px-3 py-1 bg-[#e6f6ec] text-[#0fa44a] rounded-full text-xs font-medium border border-[#0fa44a]">
                  +{recipients.length - 20} more
                </span>
              )}

              <input 
                type="text"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onKeyDown={handleRecipientKeyDown}
                onBlur={handleAddRecipient}
                placeholder={recipients.length === 0 ? "recipient@example.com (press Enter)" : ""}
                className="flex-1 outline-none text-sm bg-transparent min-w-[200px]"
              />
            </div>
            
            <input 
              type="file" 
              accept=".csv,.txt"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center text-[#0fa44a] text-sm font-medium hover:text-[#0a7a35]"
            >
              <Upload className="w-4 h-4 mr-1" />
              Upload List
            </button>
          </div>

          {/* Subject */}
          <div className="flex items-center border-b border-gray-100 pb-2">
            <label className="w-20 text-sm font-medium text-gray-700">Subject</label>
            <input 
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="flex-1 outline-none text-sm font-medium bg-transparent"
            />
          </div>

          {/* Settings Inline */}
          <div className="flex items-center space-x-8 pt-2">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">Delay between 2 emails (ms)</span>
              <input 
                type="number" 
                value={delay}
                onChange={(e) => setDelay(e.target.value)}
                placeholder="2000" 
                className="w-20 text-center border border-gray-200 rounded py-1 text-sm outline-none focus:border-[#0fa44a]" 
              />
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">Hourly Limit</span>
              <input 
                type="number" 
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(e.target.value)}
                placeholder="00" 
                className="w-16 text-center border border-gray-200 rounded py-1 text-sm outline-none focus:border-[#0fa44a]" 
              />
            </div>
          </div>

          {/* Editor Container */}
          <div className="mt-8 bg-[#f9fafb] rounded-xl border border-gray-100 overflow-hidden flex flex-col h-[400px]">
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center space-x-4 overflow-x-auto">
              <button type="button" className="text-gray-400 hover:text-gray-700"><RotateCcw className="w-4 h-4" /></button>
              <button type="button" className="text-gray-400 hover:text-gray-700"><RotateCw className="w-4 h-4" /></button>
              <div className="w-px h-4 bg-gray-200 mx-2"></div>
              <button type="button" className="text-gray-400 hover:text-gray-700"><Type className="w-4 h-4" /></button>
              <div className="w-px h-4 bg-gray-200 mx-2"></div>
              <button type="button" className="text-gray-400 hover:text-gray-700"><Bold className="w-4 h-4" /></button>
              <button type="button" className="text-gray-400 hover:text-gray-700"><Italic className="w-4 h-4" /></button>
              <button type="button" className="text-gray-400 hover:text-gray-700"><Underline className="w-4 h-4" /></button>
              <div className="w-px h-4 bg-gray-200 mx-2"></div>
              <button type="button" className="text-gray-400 hover:text-gray-700"><AlignLeft className="w-4 h-4" /></button>
              <button type="button" className="text-gray-400 hover:text-gray-700"><List className="w-4 h-4" /></button>
              <button type="button" className="text-gray-400 hover:text-gray-700"><LinkIcon className="w-4 h-4" /></button>
            </div>
            
            <textarea 
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type Your Reply..."
              className="flex-1 w-full bg-transparent p-6 outline-none resize-none text-sm text-gray-700"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
