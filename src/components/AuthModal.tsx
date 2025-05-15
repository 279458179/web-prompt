import React, { useState } from 'react';
import { Modal, Input, Button, Tabs, message } from 'antd';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, onLogin }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      message.success('登录成功');
      onLogin(userCredential.user);
      onClose();
    } catch (err: any) {
      message.error(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      message.success('注册成功，已自动登录');
      onLogin(userCredential.user);
      onClose();
    } catch (err: any) {
      message.error(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={tab === 'login' ? '登录' : '注册'}
      footer={null}
      closable={false}
      maskClosable={false}
    >
      <Tabs
        activeKey={tab}
        onChange={key => setTab(key as 'login' | 'register')}
        items={[
          { key: 'login', label: '登录' },
          { key: 'register', label: '注册' }
        ]}
        style={{ marginBottom: 24 }}
      />
      <Input
        placeholder="邮箱"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <Input.Password
        placeholder="密码"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ marginBottom: 24 }}
      />
      <Button
        type="primary"
        block
        loading={loading}
        onClick={tab === 'login' ? handleLogin : handleRegister}
        style={{ marginBottom: 8 }}
      >
        {tab === 'login' ? '登录' : '注册'}
      </Button>
    </Modal>
  );
};

export default AuthModal; 