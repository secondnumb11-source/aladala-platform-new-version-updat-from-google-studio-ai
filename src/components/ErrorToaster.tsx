import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, X } from 'lucide-react';

interface ErrorEventDetail {
  message: string;
  source?: string;
  timestamp: string;
  isSaveFailure?: boolean;
  type?: string;
  action?: string;
  payload?: any;
}

export const ErrorToaster = () => {
  return null;
};
