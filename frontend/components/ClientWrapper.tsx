"use client";

import React, { ReactNode } from 'react';

interface ClientWrapperProps {
  children: ReactNode;
}

const ClientWrapper: React.FC<ClientWrapperProps> = ({ children }) => {
  return <>{children}</>;
};

export default ClientWrapper; 