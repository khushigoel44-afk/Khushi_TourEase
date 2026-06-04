import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, Phone, MapPin, Send, Loader, ChevronDown, 
  AlertCircle, CheckCircle2, User, MessageSquare 
} from 'lucide-react';

const MESSAGE_MAX_LENGTH = 500;

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const validateName = (name) => {
        const nameRegex = /^[A-Za-z\s]+$/;
        if (!nameRegex.test(name) && name !== '') {
            return 'Name should contain only letters';
        }
        return '';
    };

    const validateEmail = (email) => {
        if (!email) {
            setEmailError('');
            setIsEmailValid(false);
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const valid = emailRegex.test(email);
        if (!valid) {
            setEmailError('Please enter a valid email address');
            setIsEmailValid(false);
        } else {
            setEmailError('');
            setIsEmailValid(true);
        }
        return valid;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'message' && value.length > MESSAGE_MAX_LENGTH) {
            return;
        }
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        setError('');
        if (name === 'email') {
            validateEmail(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const nameError = validateName(formData.name);
        if (nameError) {
            setError(nameError);
            return;
        }

        if (!validateEmail(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }

        if (!formData.name || !formData.email || !formData.message) {
            setError('Please fill all required fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/contact/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to send message');
            }

            setSubmitted(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
            setIsEmailValid(false);

            setTimeout(() => setSubmitted(false), 3000);
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const messageCharCount = formData.message.length;
    const isNearLimit = messageCharCount > MESSAGE_MAX_LENGTH * 0.9;

    return (
        <div className="min-h-screen bg-linear-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
            {/* Hero Section */}
            <div className="relative bg-linear-to-br from-teal-400 via-teal-500 to-cyan-600 dark:from-purple-700 dark:via-indigo-700 dark:to-purple-800 text-white py-20 md:py-24 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
                    <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-300 dark:bg-indigo-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                </div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 text-white tracking-tight drop-shadow-lg">
                        Get in Touch
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto text-white/90 dark:text-white/85 leading-relaxed drop-shadow-md">
                        Have a question or feedback? We'd love to hear from you.
                    </p>
                </div>
            </div>

            {/* Contact Info Cards */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 z-10 mb-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    <ContactInfoCard icon={<Mail className="w-7 h-7" />} title="Email" content="support@tourease.com" href="mailto:support@tourease.com" />
                    <ContactInfoCard icon={<Phone className="w-7 h-7" />} title="Phone" content="+1 (555) 123-4567" href="tel:+15551234567" />
                    <ContactInfoCard icon={<MapPin className="w-7 h-7" />} title="Address" content="San Francisco, CA, USA" />
                </div>
            </div>

            {/* Main Contact Form */}
            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                <div className="text-center mb-10">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-gray-900 dark:text-white">
                        Send us a Message
                    </h2>
                    <p className="text-base text-gray-600 dark:text-gray-400">
                        Fields marked with <span className="text-red-500 font-semibold">*</span> are required
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-8 md:p-10 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
                    {submitted && (
                        <div className="mb-8 p-5 bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-l-4 border-green-500 dark:border-green-400 text-green-800 dark:text-green-300 rounded-lg shadow-sm flex items-start gap-3">
                            <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5 text-green-600 dark:text-green-400" />
                            <div>
                                <p className="font-bold text-lg mb-1">Success!</p>
                                <p className="text-sm">Your message has been sent successfully. We'll get back to you soon.</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-8 p-5 bg-linear-to-r from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-l-4 border-red-500 dark:border-red-400 text-red-800 dark:text-red-300 rounded-lg shadow-sm flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                            <div>
                                <p className="font-bold text-lg mb-1">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Name Field */}
                    <div className="mb-7">
                        <label className="block text-sm font-bold mb-3 text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full pl-14 pr-5 py-4 border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-teal-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-teal-500/10 dark:focus:ring-indigo-400/10 transition-all duration-200 placeholder:text-gray-400"
                                placeholder="John Doe"
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    {/* Email Field */}
                    <div className="mb-7">
                        <label className="block text-sm font-bold mb-3 text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full pl-14 pr-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${emailError ? 'border-red-300' : isEmailValid ? 'border-green-400' : 'border-gray-200 dark:border-gray-700'}`}
                                placeholder="john.doe@example.com"
                                disabled={loading}
                                required
                            />
                        </div>
                        {emailError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{emailError}</p>}
                    </div>

                    {/* Subject Field */}
                    <div className="mb-7">
                        <label className="block text-sm font-bold mb-3 text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                            Subject <span className="text-gray-500 text-xs">(Optional)</span>
                        </label>
                        <div className="relative">
                            <MessageSquare className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                className="w-full pl-14 pr-5 py-4 border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-teal-500 dark:focus:border-indigo-400 transition-all duration-200 placeholder:text-gray-400"
                                placeholder="How can we help you today?"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Message Field */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                                Message <span className="text-red-500">*</span>
                            </label>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${isNearLimit ? 'text-orange-600 bg-orange-100' : 'text-gray-500'}`}>
                                {messageCharCount} / {MESSAGE_MAX_LENGTH}
                            </span>
                        </div>
                        <div className="relative">
                            <MessageSquare className="absolute left-5 top-5 text-gray-400 w-5 h-5" />
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows="7"
                                className="w-full pl-14 pr-5 py-4 border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-teal-500 dark:focus:border-indigo-400 resize-y min-h-[140px] placeholder:text-gray-400"
                                placeholder="Tell us more about your inquiry..."
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || (formData.email && !isEmailValid)}
                        className="w-full bg-linear-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 dark:from-indigo-600 dark:to-indigo-700 text-white font-bold text-lg py-5 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.98]"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-6 h-6 animate-spin" />
                                Sending Message...
                            </>
                        ) : (
                            <>
                                <Send className="w-6 h-6" />
                                Send Message
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Contact Info Card Component
function ContactInfoCard({ icon, title, content, href }) {
    const CardContent = (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl hover:border-teal-300 dark:hover:border-indigo-700 hover:-translate-y-1 transition-all duration-300 text-center group h-full">
            <div className="bg-linear-to-br from-teal-50 to-cyan-50 text-teal-600 dark:from-indigo-950 dark:to-purple-950 dark:text-indigo-400 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md">
                {icon}
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{title}</h3>
            <p className={`text-sm text-gray-600 dark:text-gray-400 font-medium ${href ? 'group-hover:text-teal-600 dark:group-hover:text-indigo-400 transition-colors' : ''}`}>
                {content}
            </p>
        </div>
    );

    if (href) {
        return <a href={href} className="block h-full">{CardContent}</a>;
    }
    return CardContent;
}